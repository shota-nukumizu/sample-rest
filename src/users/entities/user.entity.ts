import { ApiProperty } from "@nestjs/swagger";
import { User } from "@prisma/client";

export class UserEntity implements User {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty({ required: false, nullable: true })
    description: string | null
}