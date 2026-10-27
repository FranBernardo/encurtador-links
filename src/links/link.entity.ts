import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('links')
export class Link {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'url_original', type: 'text'})
    urlOriginal: string;

    @Column({ unique: true})
    codigo: string;

    @Column({default: 0})
    cliques: number;

    @Column({name: 'criado_em'})
    criadoEm: Date;
}