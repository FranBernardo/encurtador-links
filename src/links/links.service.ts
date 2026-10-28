import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Link } from './link.entity';

const ALFABETO =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TAMANHO_CODIGO = 6;

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
  ) {}

  async criar(urlOriginal: string): Promise<Link> {
    const codigo = this.gerarCodigo();
    const link = this.linksRepository.create({ urlOriginal, codigo });
    return this.linksRepository.save(link);
  }

    async buscarParaRedirecionar(codigo: string): Promise<string> {
    const link = await this.linksRepository.findOneBy({ codigo });

    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    await this.linksRepository.increment({ id: link.id }, 'cliques', 1);

    return link.urlOriginal;
  }

  private gerarCodigo(): string {
    let codigo = '';
    for (let i = 0; i < TAMANHO_CODIGO; i++) {
      codigo += ALFABETO[randomInt(ALFABETO.length)];
    }
    return codigo;
  }
}