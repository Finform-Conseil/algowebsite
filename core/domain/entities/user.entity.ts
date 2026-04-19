import { UserRoleEnum } from "../enums/user.enum";

export interface UserEntity {
    first_name: string;
    last_name : string;
    email : string;
    phone : string;
    profile : string;
    created_at : string;
    updated_at : string;
    roles?: Array<UserRoleEnum>;
    id : string;
}