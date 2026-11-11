import { Permission, Role } from 'appwrite';

/**
 * Who may do what.
 *
 * Table-level permissions (set in the Appwrite console, see appwrite/README.md) give the `admin`
 * label full access, and guests read access to tables that are entirely public. Tables with private
 * rows (blog posts, resumes) have row security on: each row's own permissions decide whether guests
 * can read it, and the functions below compute them.
 */
export const ADMIN_LABEL = 'admin';

/** Row permissions for a row guests may read, or none for an admin-only row. */
export const publicReadWhen = (isPublic: boolean): string[] => (isPublic ? [Permission.read(Role.any())] : []);
