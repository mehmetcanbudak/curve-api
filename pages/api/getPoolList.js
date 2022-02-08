import axios from 'axios';
import Web3 from 'web3';
import BigNumber from 'big-number';
import WEB3_CONSTANTS from 'constants/Web3';
import { fn } from '../../utils/api';
import { getFeeDistributor } from '../../utils/getters';
import { getThursdayUTCTimestamp } from '../../utils/helpers';
import { getMultiCall } from '../../utils/getters';

/* GET CURVE ADDRESS GETTER */
const ADDRESS_GETTER = '0x0000000022d53366457f9d5e68ec105046fc4383'
import ADDRESS_GETTER_ABI from '../../constants/abis/address_getter.json';
import REGISTRY_ABI from '../../constants/abis/registry.json';
import multicallAbi from '../../constants/abis/multicall.json';

const web3 = new Web3(WEB3_CONSTANTS.RPC_URL);

const address_getter_contract = new web3.eth.Contract(ADDRESS_GETTER_ABI, ADDRESS_GETTER);


export default fn(async () => {

  const multicallAddress = await getMultiCall()
  const multicall_contract = new web3.eth.Contract(multicallAbi, multicallAddress)

  const main_registry = await address_getter_contract.methods.get_address(0).call()
  const crypto_registry = await address_getter_contract.methods.get_address(5).call()
  const factory_registry = await address_getter_contract.methods.get_address(3).call()

  const registries = [main_registry, crypto_registry, factory_registry, '0xf18056bbd320e96a48e3fbf8bc061322531aac99']


  let poolList = []
  let registries_name = ['main', 'crypto', 'stable-factory', 'crypto-factory']

  for (var i = 0; i < registries.length; i++) {

    let registry = new web3.eth.Contract(REGISTRY_ABI, registries[i])
    let pool_count = await registry.methods.pool_count().call()

    let calls = []
    for (var o = 0; o < pool_count; o++) {

      calls.push([registries[i],registry.methods.pool_list(o).encodeABI()])

    }

    let aggcalls = await multicall_contract.methods.aggregate(calls).call();
    aggcalls[1].map((hex) => { poolList.push({'type': registries_name[i], 'address': web3.eth.abi.decodeParameter('address', hex)}) })

  }
  //filters duplicates
  poolList = [...poolList.reduce((map, obj) => map.set(obj.address, obj), new Map()).values()];
  return { poolList };


}, {
  maxAge: 5 * 60, // 15 min
});