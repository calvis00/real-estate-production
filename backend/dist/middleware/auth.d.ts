export declare const authMiddleware: (req: any, res: any, next: any) => Promise<any>;
export declare const attachOptionalAdmin: (req: any, _res: any, next: any) => void;
export declare const requireRoles: (roles: string[]) => (req: any, res: any, next: any) => any;
export declare const canEditField: (role: string, field: string) => boolean;
export declare const hasRoleAtLeast: (role: string, required: string) => boolean;
//# sourceMappingURL=auth.d.ts.map