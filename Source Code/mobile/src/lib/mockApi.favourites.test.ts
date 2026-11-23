import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi, mockTestTools } from './mockApi';

const login = (email: string) => mockApi.post('/auth/login', { email, password: 'SeniorLearn1!' });
describe('mock favourites', () => {
  beforeEach(() => mockTestTools?.reset());
  it('keeps favourites user-specific and prevents duplicates', async () => {
    await login('member@seniorlearn.test'); const item = (await mockApi.get('/classes')).data[0];
    await mockApi.post('/favourites', { classId: item._id });
    await expect(mockApi.post('/favourites', { classId: item._id })).rejects.toMatchObject({ response: { status: 409 } });
    await login('tutor@seniorlearn.test'); expect((await mockApi.get('/favourites')).data).toEqual([]);
  });
  it('does not treat historical changes as new and can acknowledge later changes', async () => {
    await login('tutor@seniorlearn.test'); mockTestTools?.setClass('c0', { title: 'Changed before save' });
    await login('member@seniorlearn.test'); await mockApi.post('/favourites', { classId: 'c0' });
    expect((await mockApi.get('/favourites/c0')).data.updates).toEqual([]);
    await login('tutor@seniorlearn.test'); await mockApi.put('/classes/c0', { title: 'Changed after save' });
    await login('member@seniorlearn.test'); expect((await mockApi.get('/favourites/c0')).data.updates).toHaveLength(1);
    await mockApi.put('/favourites/c0/seen'); expect((await mockApi.get('/favourites/c0')).data.updates).toEqual([]);
  });
});
