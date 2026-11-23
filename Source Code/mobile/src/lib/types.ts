export type Role='STANDARD'|'PROFESSIONAL'|'HONORARY'|'ADMIN';
export type User={id:string;name:string;email:string;roles?:Extract<Role,'STANDARD'|'PROFESSIONAL'|'HONORARY'>[];isAdmin?:boolean;role?:Role;phone?:string};
export type LearningClass={_id:string;title:string;description:string;startsAt:string;durationMinutes:number;capacity:number;status:'DRAFT'|'SCHEDULED'|'CLOSED'|'COMPLETE'|'CANCELLED';delivery:'ONLINE'|'ON_PREMISES';teamsLink?:string;address?:string;tutor:{name:string};recurrenceSeriesId?:string;occurrenceIndex?:number};
export type Enrollment={_id:string;status:'ACTIVE'|'CANCELLED';class:LearningClass};
