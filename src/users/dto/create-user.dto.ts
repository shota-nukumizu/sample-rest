import { ApiProperty } from "@nestjs/swagger";


export class CreateUserDto {
    @ApiProperty()
    name: string

    @ApiProperty({ required: false })
    description?: string
}
