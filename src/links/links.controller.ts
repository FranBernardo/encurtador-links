import { Body, Controller, Get, Param, Post, Redirect } from '@nestjs/common';
import { LinksService } from './links.service';

@Controller()
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('links')
    criar(@Body('url') url: any) {
  console.log('url recebida:', url);
  return this.linksService.criar(url);
}

 @Get(':codigo')
  @Redirect()
  async redirecionar(@Param('codigo') codigo: string) {
    const url = await this.linksService.buscarParaRedirecionar(codigo);
    return { url, statusCode: 302 };
  }
}