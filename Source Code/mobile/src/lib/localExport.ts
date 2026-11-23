import { File, Paths } from 'expo-file-system';
/** Writes, reads, and validates a readable local copy of enrolments using the SDK 58 File API. */
export async function exportEnrolments(enrolments: unknown[]) { const file=new File(Paths.document,'seniorlearn-enrolments.json'); const serialized=JSON.stringify(enrolments,null,2); file.write(serialized); const parsed=JSON.parse(await file.text()); if(!Array.isArray(parsed)||parsed.length!==enrolments.length)throw new Error('Local export validation failed'); return file.uri; }
