const { parentPort } = require('worker_threads');
const Client = require('bitcoin-core');
const BigNumber = require('bignumber.js');

const { getDataFromMultisig, getDataFromXPub, getMultisigDescriptor, getAddressFromAccount } = require('../utils/transactions');

parentPort.once("message", ({ config, currentNodeConfig, currentBitcoinNetwork }) => {
  console.log('hits transactionWorker message: ');
  (async () => {
    console.log("Recieved data from mainWorker...");

    let addresses, changeAddresses, transactions, unusedAddresses, unusedChangeAddresses, availableUtxos;
    let nodeClient = undefined;
    try {
      if (currentNodeConfig.provider !== 'Blockstream') {
        const nodeClient = new Client({
          wallet: config.name,
          host: currentNodeConfig.host || 'http://localhost:8332',
          username: currentNodeConfig.username || currentNodeConfig.rpcuser, // TODO: uniform this in the future
          password: currentNodeConfig.password || currentNodeConfig.rpcpassword,
          version: '0.20.1'
        });
        console.log('nodeClient: ', nodeClient);

        const walletList = await nodeClient.listWallets();
        console.log('walletList: ', walletList);

        if (!walletList.includes(config.name)) {
          try {
            const walletResp = await nodeClient.loadWallet({ filename: config.name });
          } catch (e) { // if failed to load wallet, then probably doesnt exist so let's create one and import
            await nodeClient.createWallet({ wallet_name: config.name });
            if (config.quorum.totalSigners === 1) {
              const ADDRESS_IMPORT_NUM = 500;
              for (let i = 0; i < ADDRESS_IMPORT_NUM; i++) {
                const receiveAddress = getAddressFromAccount(config, `m/0/${i}`, currentBitcoinNetwork)
                const changeAddress = getAddressFromAccount(config, `m/1/${i}`, currentBitcoinNetwork)

                await nodeClient.importAddress({
                  address: receiveAddress.address,
                  rescan: false
                });

                await nodeClient.importAddress({
                  address: changeAddress.address,
                  rescan: false
                });
              }
            } else { // multisig
              //  import receive addresses
              await nodeClient.importMulti({
                desc: getMultisigDescriptor(nodeClient, config.quorum.requiredSigners, config.extendedPublicKeys, true),
                // range: '[0, 1000]'
              });

              // import change
              await nodeClient.importMulti({
                desc: getMultisigDescriptor(nodeClient, config.quorum.requiredSigners, config.extendedPublicKeys, false),
                // range: '[0, 1000]'
              });
            }
          }
        }
      }
      console.log('after node setup')

      if (config.quorum.totalSigners > 1) {
        [addresses, changeAddresses, transactions, unusedAddresses, unusedChangeAddresses, availableUtxos] = await getDataFromMultisig(config, nodeClient, currentBitcoinNetwork);
      } else {
        [addresses, changeAddresses, transactions, unusedAddresses, unusedChangeAddresses, availableUtxos] = await getDataFromXPub(config, nodeClient, currentBitcoinNetwork);
      }
      console.log('before currentBalance')

      const currentBalance = availableUtxos.reduce((accum, utxo) => accum.plus(utxo.value), BigNumber(0));

      console.log('before accountData')
      const accountData = {
        name: config.name,
        config: config,
        addresses,
        changeAddresses,
        availableUtxos,
        transactions,
        unusedAddresses,
        currentBalance: currentBalance.toNumber(),
        unusedChangeAddresses
      };

      parentPort.postMessage(accountData);

    } catch (e) {
      console.log('error')
    }
  })()
});