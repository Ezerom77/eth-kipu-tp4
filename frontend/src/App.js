import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  SIMPLE_SWAP_ADDRESS,
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  SIMPLE_SWAP_ABI,
  ERC20_ABI
} from './contracts/config';
import './App.css';

function App() {
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [simpleSwap, setSimpleSwap] = useState(null);
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [tokenASymbol, setTokenASymbol] = useState('');
  const [tokenBSymbol, setTokenBSymbol] = useState('');
  const [tokenABalance, setTokenABalance] = useState('0');
  const [tokenBBalance, setTokenBBalance] = useState('0');
  const [amountIn, setAmountIn] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [swapDirection, setSwapDirection] = useState('AtoB'); // 'AtoB' or 'BtoA'
  const [price, setPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Estado para mensajes de éxito
  const [reserveA, setReserveA] = useState('0');
  const [reserveB, setReserveB] = useState('0');
  const [hasLiquidity, setHasLiquidity] = useState(false);

  // Definir la función updateBalances con useCallback
  const updateBalances = useCallback(async (userAccount) => {
    try {
      if (!tokenA || !tokenB || !userAccount) return;

      const decimalsA = await tokenA.decimals();
      const decimalsB = await tokenB.decimals();

      const balanceA = await tokenA.balanceOf(userAccount);
      const balanceB = await tokenB.balanceOf(userAccount);

      setTokenABalance(ethers.formatUnits(balanceA, decimalsA));
      setTokenBBalance(ethers.formatUnits(balanceB, decimalsB));
    } catch (err) {
      console.error('Error al actualizar balances:', err);
    }
  }, [tokenA, tokenB]);

  // Definir la función checkReserves con useCallback
  const checkReserves = useCallback(async () => {
    try {
      if (!simpleSwap || !tokenA || !tokenB) return;

      const [resA, resB] = await simpleSwap.getReserves(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
      const decimalsA = await tokenA.decimals();
      const decimalsB = await tokenB.decimals();

      setReserveA(ethers.formatUnits(resA, decimalsA));
      setReserveB(ethers.formatUnits(resB, decimalsB));

      // Verificar si hay liquidez
      setHasLiquidity(resA > 0 && resB > 0);
    } catch (err) {
      console.error('Error al obtener reservas:', err);
    }
  }, [simpleSwap, tokenA, tokenB]);

  // Definir la función updatePrice con useCallback
  const updatePrice = useCallback(async () => {
    try {
      if (!simpleSwap) return;

      const priceResult = await simpleSwap.getPrice(
        swapDirection === 'AtoB' ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS,
        swapDirection === 'AtoB' ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS
      );

      setPrice(ethers.formatUnits(priceResult, 18));
    } catch (err) {
      console.error('Error al obtener precio:', err);
    }
  }, [simpleSwap, swapDirection]);

  // Definir handleAccountsChanged con useCallback
  const handleAccountsChanged = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      setAccount('');
      setSigner(null);
      setTokenABalance('0');
      setTokenBBalance('0');
    } else {
      setAccount(accounts[0]);
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await ethersProvider.getSigner();
      setSigner(signerInstance);

      // Solo actualizar balances si los tokens están definidos
      if (tokenA && tokenB) {
        await updateBalances(accounts[0]);
      }
    }
  }, [tokenA, tokenB, updateBalances]);

  // Definir la función connectWallet con useCallback
  const connectWallet = useCallback(async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
    } catch (err) {
      console.error('Error al conectar wallet:', err);
      setError('Error al conectar wallet: ' + (err.message || err));
    }
  }, [handleAccountsChanged]);

  // Definir estimateOutput con useCallback
  const estimateOutput = useCallback(async () => {
    if (!amountIn || parseFloat(amountIn) === 0 || !simpleSwap) {
      setEstimatedOutput('0');
      return;
    }

    try {
      // Obtener reservas
      const [reserveA, reserveB] = await simpleSwap.getReserves(
        swapDirection === 'AtoB' ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS,
        swapDirection === 'AtoB' ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS
      );

      // Verificar si hay liquidez
      if (reserveA.toString() === '0' || reserveB.toString() === '0') {
        setError('No hay liquidez suficiente en el pool.');
        setEstimatedOutput('0');
        return;
      }

      // Obtener decimales
      const decimalsIn = await (swapDirection === 'AtoB' ? tokenA : tokenB).decimals();
      const decimalsOut = await (swapDirection === 'AtoB' ? tokenB : tokenA).decimals();

      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);

      // Calcular salida estimada
      const amountOutWei = await simpleSwap.getAmountOut(
        amountInWei,
        swapDirection === 'AtoB' ? reserveA : reserveB,
        swapDirection === 'AtoB' ? reserveB : reserveA
      );

      setEstimatedOutput(ethers.formatUnits(amountOutWei, decimalsOut));
      setError(''); // Limpiar error si hay liquidez
    } catch (err) {
      console.error('Error al estimar salida:', err);
      setEstimatedOutput('0');
      setError('Error al estimar la salida: ' + (err.message || err));
    }
  }, [amountIn, simpleSwap, swapDirection, tokenA, tokenB]);

  // Memoizar handleSwapDirectionToggle con useCallback
  const handleSwapDirectionToggle = useCallback(() => {
    setSwapDirection(prev => prev === 'AtoB' ? 'BtoA' : 'AtoB');
    setAmountIn('');
    setEstimatedOutput('0');
  }, []);

  // Memoizar executeSwap con useCallback
  const executeSwap = useCallback(async () => {
    if (!signer || !amountIn || parseFloat(amountIn) === 0) return;

    setLoading(true);
    setError('');
    setSuccess(''); // Limpiar mensaje de éxito anterior

    try {
      // Verificar si hay liquidez antes de ejecutar el swap
      const [resA, resB] = await simpleSwap.getReserves(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
      if (resA.toString() === '0' || resB.toString() === '0') {
        throw new Error('No hay liquidez suficiente en el pool.');
      }

      const tokenInContract = swapDirection === 'AtoB' ? tokenA : tokenB;
      const tokenInAddress = swapDirection === 'AtoB' ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = swapDirection === 'AtoB' ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const decimalsIn = await tokenInContract.decimals();

      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);

      // Aprobar el gasto de tokens
      const approvalTx = await tokenInContract.connect(signer).approve(SIMPLE_SWAP_ADDRESS, amountInWei);
      await approvalTx.wait();

      // Preparar parámetros para el swap
      const path = [tokenInAddress, tokenOutAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutos

      // Calcular un amountOutMin razonable (95% del estimado)
      const [reserveIn, reserveOut] = await simpleSwap.getReserves(tokenInAddress, tokenOutAddress);
      const amountOutWei = await simpleSwap.getAmountOut(amountInWei, reserveIn, reserveOut);

      // Corrección: Usar operaciones BigInt correctamente
      const amountOutMin = amountOutWei * 95n / 100n;

      // Ejecutar swap
      const swapTx = await simpleSwap.connect(signer).swapExactTokensForTokens(
        amountInWei,
        amountOutMin,
        path,
        account,
        deadline
      );

      await swapTx.wait();

      // Actualizar balances y limpiar campos
      await updateBalances(account);
      await checkReserves();
      setAmountIn('');
      setEstimatedOutput('0');

      // Mostrar mensaje de éxito
      const tokenInSymbol = swapDirection === 'AtoB' ? tokenASymbol : tokenBSymbol;
      const tokenOutSymbol = swapDirection === 'AtoB' ? tokenBSymbol : tokenASymbol;
      setSuccess(`¡Intercambio exitoso! Has cambiado ${amountIn} ${tokenInSymbol} por ${ethers.formatUnits(amountOutWei, await (swapDirection === 'AtoB' ? tokenB : tokenA).decimals())} ${tokenOutSymbol}`);

    } catch (err) {
      console.error('Error al ejecutar swap:', err);
      setError('Error al ejecutar el intercambio: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, [signer, amountIn, simpleSwap, swapDirection, tokenA, tokenB, account, updateBalances, checkReserves, tokenASymbol, tokenBSymbol]);

  // Inicialización de la aplicación - Separada en su propio useEffect
  useEffect(() => {
    const init = async () => {
      try {
        const ethereumProvider = await detectEthereumProvider();

        if (ethereumProvider) {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);

          // Inicializar contratos
          const simpleSwapContract = new ethers.Contract(
            SIMPLE_SWAP_ADDRESS,
            SIMPLE_SWAP_ABI,
            ethersProvider
          );
          setSimpleSwap(simpleSwapContract);

          const tokenAContract = new ethers.Contract(
            TOKEN_A_ADDRESS,
            ERC20_ABI,
            ethersProvider
          );
          setTokenA(tokenAContract);

          const tokenBContract = new ethers.Contract(
            TOKEN_B_ADDRESS,
            ERC20_ABI,
            ethersProvider
          );
          setTokenB(tokenBContract);

          // Obtener símbolos de tokens
          const symbolA = await tokenAContract.symbol();
          const symbolB = await tokenBContract.symbol();
          setTokenASymbol(symbolA);
          setTokenBSymbol(symbolB);
        } else {
          setError('Por favor instala MetaMask para usar esta aplicación');
        }
      } catch (err) {
        console.error('Error al inicializar:', err);
        setError('Error al inicializar la aplicación');
      }
    };

    init();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Configurar event listeners para MetaMask - Separado en su propio useEffect
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Verificar si ya hay una cuenta conectada
      const checkAccounts = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleAccountsChanged(accounts);
        }
      };

      checkAccounts();

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [handleAccountsChanged]);

  // Efecto para actualizar precio y reservas cuando cambia simpleSwap o swapDirection
  useEffect(() => {
    if (simpleSwap) {
      const updateData = async () => {
        await updatePrice();
        await checkReserves();
      };
      updateData();
    }
  }, [simpleSwap, swapDirection, updatePrice, checkReserves]);

  // Efecto para estimar output cuando cambia amountIn
  useEffect(() => {
    if (simpleSwap && amountIn) {
      estimateOutput();
    }
  }, [amountIn, simpleSwap, estimateOutput]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ezerom77's SimpleSwap</h1>

        {!account ? (
          <button onClick={connectWallet} className="connect-button">
            Conectar Wallet
          </button>
        ) : (
          <div className="account-info">
            <p>Cuenta conectada: {account.substring(0, 6)}...{account.substring(38)}</p>
            <p>Balance {tokenASymbol}: {parseFloat(tokenABalance).toFixed(18)}</p>
            <p>Balance {tokenBSymbol}: {parseFloat(tokenBBalance).toFixed(18)}</p>
          </div>
        )}
      </header>

      <main className="swap-container">
        {/* Información de reservas */}
        <div className="reserves-info">
          <p>Reservas del contrato: {parseFloat(reserveA).toFixed(18)} {tokenASymbol} / {parseFloat(reserveB).toFixed(18)} {tokenBSymbol}</p>
          {!hasLiquidity && (
            <p className="warning-message">No hay liquidez en el pool.</p>
          )}
        </div>

        {/* Sección de Swap */}
        <>
          <div className="price-display">
            <p>Precio: 1 {swapDirection === 'AtoB' ? tokenASymbol : tokenBSymbol} = {parseFloat(price).toFixed(6)} {swapDirection === 'AtoB' ? tokenBSymbol : tokenASymbol}</p>
          </div>

          <div className="swap-box">
            <div className="input-group">
              <label>De {swapDirection === 'AtoB' ? tokenASymbol : tokenBSymbol}</label>
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder={`Cantidad de ${swapDirection === 'AtoB' ? tokenASymbol : tokenBSymbol}`}
                disabled={!account || loading}
              />
            </div>

            <button onClick={handleSwapDirectionToggle} className="direction-toggle">
              ↑↓
            </button>

            <div className="input-group">
              <label>A {swapDirection === 'AtoB' ? tokenBSymbol : tokenASymbol}</label>
              <input
                type="text"
                value={estimatedOutput}
                readOnly
                placeholder="Cantidad estimada"
              />
            </div>

            <button
              onClick={executeSwap}
              disabled={!account || !amountIn || parseFloat(amountIn) === 0 || loading || !hasLiquidity}
              className="swap-button"
            >
              {loading ? 'Procesando...' : 'Intercambiar'}
            </button>

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </div>
        </>
      </main>
    </div>
  );
}

export default App;