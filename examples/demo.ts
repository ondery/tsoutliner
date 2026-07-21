/**
 * Demo TypeScript file for TS Outliner.
 */
export interface User {
  id: string;
  name: string;
}

export abstract class BaseService {
  protected readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  abstract fetch(id: string): Promise<User>;
}

export class UserService extends BaseService {
  private cache = new Map<string, User>();

  static version = "1.0.0";

  async fetch(id: string): Promise<User> {
    return this.cache.get(id) ?? { id, name: "Unknown" };
  }

  get displayName(): string {
    return "UserService";
  }

  set displayName(_value: string) {
    // ignore
  }
}

export async function createUser(name: string): Promise<User> {
  return { id: crypto.randomUUID(), name };
}

const helper = (n: number) => n * 2;
