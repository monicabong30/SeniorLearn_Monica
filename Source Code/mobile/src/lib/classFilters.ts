export type ClassFilter = 'All' | 'Available' | 'Enrolled' | 'Favourites' | 'Not Available';
export type ClassSort = 'Earliest' | 'Latest' | 'Title';

export function filterAndSortClasses<T extends { _id: string; title: string; status: string; delivery: string; startsAt: string }>(items: T[], enrollments: any[], favourites: any[], filter: ClassFilter, sort: ClassSort, now = new Date()): T[] {
  return items.filter(item => filter === 'All' || (filter === 'Available' && item.status === 'SCHEDULED' && !enrollments.some(enrolment => enrolment.class?._id === item._id && enrolment.status === 'ACTIVE')) || (filter === 'Enrolled' && enrollments.some(enrolment => enrolment.class?._id === item._id && enrolment.status === 'ACTIVE')) || (filter === 'Favourites' && favourites.some(favourite => favourite.class?._id === item._id)) || (filter === 'Not Available' && ['CLOSED','CANCELLED'].includes(item.status))).sort((a, b) => sort === 'Title' ? a.title.localeCompare(b.title) : sort === 'Latest' ? +new Date(b.startsAt) - +new Date(a.startsAt) : +new Date(a.startsAt) - +new Date(b.startsAt));
}
