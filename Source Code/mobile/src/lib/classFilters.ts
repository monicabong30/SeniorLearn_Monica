export type ClassFilter = 'All' | 'Available' | 'Enrolled' | 'Favourites' | 'Past classes' | 'Not Available';
export type ClassSort = 'Upcoming' | 'Furthest' | 'TitleAsc' | 'TitleDesc';

export function filterAndSortClasses<T extends { _id: string; title: string; status: string; delivery: string; startsAt: string }>(items: T[], enrollments: any[], favourites: any[], filter: ClassFilter, sort: ClassSort, now = new Date()): T[] {
  return items.filter(item => filter === 'All' || (filter === 'Available' && item.status === 'SCHEDULED' && !enrollments.some(enrolment => enrolment.class?._id === item._id && enrolment.status === 'ACTIVE')) || (filter === 'Enrolled' && enrollments.some(enrolment => enrolment.class?._id === item._id && enrolment.status === 'ACTIVE')) || (filter === 'Favourites' && favourites.some(favourite => favourite.class?._id === item._id)) || (filter === 'Past classes' && (item.status === 'COMPLETE' || +new Date(item.startsAt) < +now)) || (filter === 'Not Available' && ['CLOSED','CANCELLED'].includes(item.status))).sort((a, b) => {
    if (sort === 'TitleAsc') return a.title.localeCompare(b.title);
    if (sort === 'TitleDesc') return b.title.localeCompare(a.title);
    if (sort === 'Furthest') return +new Date(b.startsAt) - +new Date(a.startsAt);
    const aUpcoming = +new Date(a.startsAt) >= +now, bUpcoming = +new Date(b.startsAt) >= +now;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return +new Date(a.startsAt) - +new Date(b.startsAt);
  });
}
