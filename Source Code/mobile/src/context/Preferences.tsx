import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { normalizeStoredPreferences, normalizeTextScale, TEXT_SCALE_DEFAULT } from '../lib/preferences';
type Preferences={fontScale:number;classFilter:string;setFontScale:(n:number)=>Promise<void>;setClassFilter:(v:string)=>Promise<void>;reset:()=>Promise<void>};
const C=createContext<Preferences>(null!); const key='seniorlearn.preferences'; const defaults={fontScale:TEXT_SCALE_DEFAULT,classFilter:''};
export function PreferencesProvider({children}:any){const[p,setP]=useState(defaults);useEffect(()=>{const load=async()=>{try{const raw=await AsyncStorage.getItem(key);if(!raw)return;const {preferences,migrated}=normalizeStoredPreferences(JSON.parse(raw));setP(preferences);if(migrated)await AsyncStorage.setItem(key,JSON.stringify(preferences));}catch{setP(defaults)}};void load()},[]);const update=async(next:{fontScale:number;classFilter:string})=>{setP(next);await AsyncStorage.setItem(key,JSON.stringify(next));};const value:Preferences={fontScale:p.fontScale,classFilter:p.classFilter,setFontScale:n=>update({...p,fontScale:normalizeTextScale(n)}),setClassFilter:v=>update({...p,classFilter:v}),reset:()=>update(defaults)};return <C.Provider value={value}>{children}</C.Provider>}
export const usePreferences=()=>useContext(C);
