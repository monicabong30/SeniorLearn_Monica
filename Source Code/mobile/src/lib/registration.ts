export const emailError=(v:string)=>!v.trim()?'Email address is required.':!/^\S+@\S+\.\S+$/.test(v.trim())?'Please enter a valid email address.':'';
export const passwordError=(v:string)=>v.length<8?'Use at least 8 characters.':'';

/** Validates a calendar date without UTC conversion or JavaScript date normalisation. */
export const dateOnly=(v:string)=>{
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if(!match)return false;
  const [,year,month,day]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  return date.getFullYear()===Number(year)&&date.getMonth()===Number(month)-1&&date.getDate()===Number(day);
};

export const localDateOnly=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
export const readableDate=(v:string)=>dateOnly(v)?new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${v}T12:00:00`)):'';
export const compactReadableDate=(v:string)=>dateOnly(v)?new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`)):'';
