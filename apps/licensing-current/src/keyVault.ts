import * as SecureStore from 'expo-secure-store';
import {toByteArray} from 'base64-js';
import {PUBLIC_KEY_B64} from './privateKey';
const KEY='shahboun.licensing.signing.secret.v1';
export async function hasSigningKey(){return !!(await SecureStore.getItemAsync(KEY))}
export async function getSigningKey(){return await SecureStore.getItemAsync(KEY)}
export async function importSigningKeyBackup(text:string){const secret=(text.match(/SECRET_KEY_B64=([^\s]+)/)||[])[1]||text.trim();const publicInFile=(text.match(/PUBLIC_KEY_B64=([^\s]+)/)||[])[1];if(publicInFile&&publicInFile!==PUBLIC_KEY_B64)throw new Error('PUBLIC_KEY_MISMATCH');let sk:Uint8Array,pk:Uint8Array;try{sk=toByteArray(secret);pk=toByteArray(PUBLIC_KEY_B64)}catch{throw new Error('INVALID_SIGNING_KEY')}if(sk.length!==64||pk.length!==32)throw new Error('INVALID_SIGNING_KEY');for(let i=0;i<32;i++)if(sk[32+i]!==pk[i])throw new Error('SIGNING_KEYPAIR_MISMATCH');await SecureStore.setItemAsync(KEY,secret,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});return true}
export async function removeSigningKey(){await SecureStore.deleteItemAsync(KEY)}
