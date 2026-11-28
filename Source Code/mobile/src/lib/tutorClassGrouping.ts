export type TutorClass = { _id:string; recurrenceSeriesId?:string; startsAt:string; status:string; title:string; durationMinutes:number; capacity:number; enrollmentCount?:number };
export type ClassTypeFilter = 'ALL'|'SINGLE'|'RECURRING';

export type RecurringSeries = { kind:'SERIES'; seriesId:string; items:TutorClass[] };
export type TutorDashboardItem = TutorClass | RecurringSeries;

export function groupTutorClasses(items:TutorClass[], type:ClassTypeFilter, status:string):TutorDashboardItem[] {
  const singles = items.filter(item => !item.recurrenceSeriesId);
  const series = new Map<string, TutorClass[]>();
  for (const item of items) if (item.recurrenceSeriesId) series.set(item.recurrenceSeriesId, [...(series.get(item.recurrenceSeriesId) || []), item]);
  const recurring:RecurringSeries[] = [...series.entries()].map(([seriesId, rows]) => ({ kind:'SERIES', seriesId, items:rows.sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt)) }));
  const seriesStatus = (rows:TutorClass[]) => {
    const states=rows.map(row=>row.status);
    if (!states.length || states.every(value=>value==='DRAFT')) return 'DRAFT';
    if (states.every(value=>value==='CANCELLED')) return 'CANCELLED';
    const unfinished=states.filter(value=>!['COMPLETE','CANCELLED'].includes(value));
    if (!unfinished.length && states.includes('COMPLETE')) return 'COMPLETE';
    if (!states.includes('SCHEDULED')) return 'CLOSED';
    return 'SCHEDULED';
  };
  const matches = (rows:TutorClass[]) => status === 'ALL' || (rows.length === 1 ? rows[0].status : seriesStatus(rows) === status);
  const result:TutorDashboardItem[] = [
    ...(type === 'RECURRING' ? [] : singles.filter(item => matches([item]))),
    ...(type === 'SINGLE' ? [] : recurring.filter(item => matches(item.items))),
  ];
  return result.sort((a,b) => +new Date(('kind' in a ? a.items[0] : a).startsAt) - +new Date(('kind' in b ? b.items[0] : b).startsAt));
}

export const seriesStatusSummary = (items:TutorClass[]) => {
  const states=items.map(item=>item.status); if(!states.length||states.every(x=>x==='DRAFT'))return 'DRAFT'; if(states.every(x=>x==='CANCELLED'))return 'CANCELLED'; const unfinished=states.filter(x=>!['COMPLETE','CANCELLED'].includes(x)); return !unfinished.length&&states.includes('COMPLETE')?'COMPLETE':!states.includes('SCHEDULED')?'CLOSED':'SCHEDULED';
};
