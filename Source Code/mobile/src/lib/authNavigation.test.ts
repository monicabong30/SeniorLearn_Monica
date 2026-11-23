import { describe,expect,it } from 'vitest';import{logoutDestination}from'./authNavigation';
describe('logout navigation',()=>{it('uses the public login route and no stack action',()=>expect(logoutDestination).toBe('/(auth)/login'))});
