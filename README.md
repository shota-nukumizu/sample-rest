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

# データベースの設計

データベースへの接続は`schema.prisma`ファイルの`datasource`ブロックで設定される。デフォルトでは`postgresql`に設定されているが、本チュートリアルではSQLiteを使うので、`datasource`ブロックのプロバイダフィールドを`sqlite`に調整しなければならない。

```prisma
datasource db {
  provider = "sqlite" // ここを"postgresql" => "sqlite"にする
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

ここで、`.env`を開いて`DATABASE_URL`環境変数を以下のように調整する。

```
DATABASE_URL="file:./dev.db"
```

SQLiteは単純なファイルであり、SQLiteを使用するためにサーバーは必要ない。したがって、ホストとポートを含む接続URLを設定する代わりに、ローカルファイル（この場合`dev.db`と呼ばれる）を指定するだけでいい。

## モデルを設計する

実際に、`schema.prisma`ファイルにデータベースの情報を書いていく。

```prisma
datasource db {
  provider = "sqlite" // ここを"postgresql" => "sqlite"にする
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 以下のプログラムを追加する
model User {
  id Int @id @default(autoincrement()) // idを設定して、自動で生成する
  name String @unique // nameが他のnameと一致している場合はnull
  description String? //後ろに?をつけることで、nullableを示す。(要はなくてもいい)
}
```

## データベースのマイグレーション(接続)

`schema.prisma`ファイルを作成した後は、以下のコマンドを入力する。

```
npx prisma migrate dev --name "init"
```

成功した場合、このようにターミナルにメッセージが表示される

```
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20220528101323_init/
    └─ migration.sql

Your database is now in sync with your schema.
...
✔ Generated Prisma Client (3.14.0 | library) to ./node_modules/@prisma/client in 31ms
```

以下のファイルはコマンドで生成されたSQLファイルになる。

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
```

## データベースの作成

`prisma`ディレクトリに新規で`seed.ts`ファイルを作成する

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const post1 = await prisma.user.upsert({
        where: {name: 'Shota Nukumizu'}, // データベースを設置する場所
        update: {}, // データ更新をする必要がないのでとりあえず保留
        // データの中身を設計する
        create: {
            name: 'Shota Nukumizu',
            description: 'A programmer'
        },
    })

    const post2 = await prisma.user.upsert({
        where: {name: 'Furukawa Shuntaro'},
        update: {},
        create: {
            name: 'Furukawa Shuntaro',
            description: 'The President of Nintendo'
        }
    })

    console.log({post1, post2})
}

main()
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
```

`package.json`にprismaコマンドを入力する

```json
// package.json

// ...
  "scripts": {
    // ...
  },
  "dependencies": {
    // ...
  },
  "devDependencies": {
    // ...
  },
  "jest": {
    // ...
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
```

`seed`コマンドは、以前に定義した`prisma/seed.ts`ファイルを実行する。`ts-node`はすでに`package.json`でdev依存としてインストールされているため、このコマンドは自動的に動作する。

以下のコマンドで`seed`を実行する。

```
npx prisma db seed
```

# Prismaサービスの作成

以下のコマンドで、NestJSアプリ開発に必要な`Module`と`Service`をインストールしておく

```
npx nest g module prisma
npx nest g service prisma
```

これによって、新しいサブディレクトリ`./src/prisma`が生成され、`prisma.module.ts`と`prisma.service.ts`ファイルが生成される。

`src/prisma/prisma.service.ts`

```ts
import { INestApplication, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

`src/prisma/prisma.module.ts`

`PrismaService`をインポートしてNestJSアプリケーションにPrisma操作を認識させる。

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

# Swaggerのセットアップ

SwaggerはOpenAPIの仕様を使ってAPIをドキュメント化するためのツールである。NestJSには、Swaggerのための専用モジュールがある。

まずは必要な依存関係・ライブラリをインストールしよう。

```powershell
npm install --save @nestjs/swagger swagger-ui-express
```

`src/main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Sample REST API')
    .setDescription('REST API Tutorial in NestJS')
    .setVersion('0.1')
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
  
  await app.listen(3000);
}
bootstrap();
```

ここで開発者サーバを立ち上げて、`http://localhost:3000/api/`にアクセスする。そうすれば、Swaggerの画面が表示されるだろう。

なお、Swaggerを導入する理由は**REST APIの挙動を目視で確認できるようにする**ため。

# CRUD操作の実装

ここから実際にREST APIを設計していく。NestJSでは、以下のコマンドで簡単にCRUD設計のプロトタイプを生成できる。

```
npx nest g resource
```

以下のように質問に回答する。

1. `What name would you like to use for this resource (plural, e.g., "users")?`: **users**
2. `What transport layer do you use?`: **REST API**
3. `Would you like to generate CRUD entry points?`: **Yes**

これで、新しい`src/users`ディレクトリにRESTエンドポイント用の定型文がすべて揃った。

`src/users/users.controller.ts`ファイル内には、異なるルート(ルートハンドラ)の定義がある。各リクエストを処理するビジネスロジックは、`src/users/users.service.ts`ファイルにカプセル化される。

## `PrismaClient`を`Articles`Moduleに付け加える

`PrismaClient`を`Articles`Moduleに付け加えるために、`PrismaModule`をインポートしなければならない。以下のように`imports`のリストに`UsersModule`を追加しておこう。

`src/users/users.module.ts`

```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule]
})
export class UsersModule {}
```

これで、`UsersService`の中に`PrismaService`を注入し、それを使ってデータベースにアクセスできるようになりました。これを行うには、`users.service.ts`に以下のようなコンストラクタを追加します。

`src/articles/articles.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service'; // 追加

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {} // 追加

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
```

## `GET`エンドポイントの実装

NestJSにおける`GET`エンドポイントは以下のように表現される。(コントローラの場合)

```ts
// src/users/users.controller.ts

@Get()
findAll() {
  return this.usersService.findAll();
}
```

データベース内のすべての名前リストの配列を返すように、`UsersService.findAll()`を更新しなければならない。

```ts
findAll() {
  // return `This action returns all users`;
  return this.prisma.user.findMany()
}
```

このようにプログラムを書き換えて、`http://localhost:3000/api/`にアクセスしてドロップダウンメニューの`GET`をクリックして実行する。

## `GET /users/:id`エンドポイントの実装

コントローラでは、`findOne`でデータベース内にあるデータの詳細を獲得できる。

`src/users/users.controller.ts`

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(+id);
}
```

こちらのルーティングは動的な`id`パラメータを受け取って、`findOne`コントローラルートハンドラに渡される。`Article`モデルには整数の`id`フィールドがあるので、`id`パラメータは`+`演算子を使って数値にキャストしなければならない。

ここで、`UsersService`の`findOne`メソッドを更新して、指定された`id`を持つデータを返すようにする。

`src/users/users.service.ts`

```ts
findOne(id: number) {
  // return `This action returns a #${id} user`;
  return this.prisma.user.findUnique({ where: { id } });
}
```

`http://localhost:3000/api/`にアクセスしてドロップダウンメニューの`GET /users/{id}`をクリックする。

