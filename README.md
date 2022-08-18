# 【NestJSハンズオン #1】NestJSで簡単なREST APIを作ろう

こちらのリポジトリは2022年8月27日(土)に福岡市赤煉瓦文化館で実施される「【NestJSハンズオン #1】NestJSで簡単なREST APIを作ろう」で使われるものである。

# 開発環境

* Visual Studio Code 1.70
* Windows 11
* TypeScript 4.7
* NestJS
* Prisma
* Swagger

# 大まかな手順

1. Prismaのセットアップ
2. データベースのマイグレーション
3. データベースのデータ作成、`prisma`サービスの作成
4. Swaggerのセットアップ
5. `GET`、`POST`、`PUT`、`DELETE`メソッドの実装
6. レスポンス型の設定

# 初期設定

まずは以下のコマンドを入力する。

```powershell
# NestJS CLIの場合
npx nest new <project-name>

# Gitコマンドの場合。公式がテンプレートを用意してくれるのでそれを使う
git clone https://github.com/nestjs/typescript-starter.git project
cd project
npm install
```

# 開発者サーバの立ち上げ

```powershell
npm run start
```

`http://localhost:3000/`にアクセスすれば、画面に`Hello World`が出力されるはず。

# 簡単なディレクトリ紹介

NestJSの初期のディレクトリは以下の通り。本章では`src`フォルダのファイルを中心に話す。

```
src
 -  app.controller.spec.ts
 -  app.controller.ts
 -  app.module.ts
 -  app.service.ts
 -  main.ts
```

## `app.controller.spec.ts`

`Controller`のユニットテストを行う際に使用するファイル。

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()
  })

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get<AppController>(AppController)
      expect(appController.getHello()).toBe('Hello World!')
    });
  });
});
```

## `app.controller.ts`

単一の`route`を持つ基本的な`Controller`。

```ts
import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
```

## `app.module.ts`

NestJSアプリケーションの基盤となる`Module`を扱う。

```ts
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## `app.service.ts`

単一のメソッドを持つ基本的な`Service`。

```ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!'
  }
}
```

## `main.ts`

コア関数`NestFactory`を活用してNestJSアプリケーションのインスタンスを作成するアプリケーションのエントリーファイル。

```ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

// この処理で開発者サーバを起動できる。
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
bootstrap()
```

# Prismaのセットアップ

PrismaはNode.jsとTypeScript専用のオープンソースのORMである。ORM(Object-Relational Mapping)はデータベースに対するデータの操作をオブジェクト指向型言語のやり方で扱えるようにするための手法である。

ORMを使うことで、データベースを設計する際にSQL言語を書く必要はなくなる。

最初に以下のコマンドを入力してPrismaをインストールする。

```
npm install prisma --save-dev
```

以下はPrisma CLIを使う。ここで、Prisma CLIの`init`コマンドでPrismaの初期設定を行う。

```
npx prisma init
```

こちらのコマンドは、以下のファイルで新しい`prisma`ディレクトリを作成する。

* `schema.prisma`：データベース接続を指定し、データベーススキーマを格納する
* `.env`：データベースの認証情報を環境変数のグループに格納する際に使う

