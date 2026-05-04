type MessageArg = string | { message: string };

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface Schema<T> {
  parse(value: unknown): T;
  safeParse(value: unknown): ParseResult<T>;
  optional(): Schema<T | undefined>;
  nullable(): Schema<T | null>;
}

class BaseSchema<T> implements Schema<T> {
  constructor(protected readonly parser: (value: unknown) => T) {}

  parse(value: unknown): T {
    return this.parser(value);
  }

  safeParse(value: unknown): ParseResult<T> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Invalid value" };
    }
  }

  optional(): Schema<T | undefined> {
    return new BaseSchema<T | undefined>((value) => (value === undefined ? undefined : this.parse(value)));
  }

  nullable(): Schema<T | null> {
    return new BaseSchema<T | null>((value) => (value === null ? null : this.parse(value)));
  }
}

class StringSchema extends BaseSchema<string> {
  min(length: number, _message?: MessageArg): StringSchema {
    return new StringSchema((value) => {
      const parsed = this.parse(value);
      if (parsed.length < length) throw new Error("String too short");
      return parsed;
    });
  }

  email(_message?: MessageArg): StringSchema {
    return new StringSchema((value) => {
      const parsed = this.parse(value);
      if (!parsed.includes("@")) throw new Error("Invalid email");
      return parsed;
    });
  }

  uuid(_message?: MessageArg): StringSchema {
    return new StringSchema((value) => {
      const parsed = this.parse(value);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed)) {
        throw new Error("Invalid UUID");
      }
      return parsed;
    });
  }

  datetime(_message?: MessageArg): StringSchema {
    return new StringSchema((value) => {
      const parsed = this.parse(value);
      if (Number.isNaN(Date.parse(parsed))) throw new Error("Invalid datetime");
      return parsed;
    });
  }

  url(_message?: MessageArg): StringSchema {
    return new StringSchema((value) => {
      const parsed = this.parse(value);
      try {
        new URL(parsed);
        return parsed;
      } catch {
        throw new Error("Invalid URL");
      }
    });
  }
}

class BooleanSchema extends BaseSchema<boolean> {}

type Shape = Record<string, Schema<unknown>>;
type InferShape<TShape extends Shape> = {
  [K in keyof TShape]: TShape[K] extends Schema<infer TValue> ? TValue : never;
};

class ObjectSchema<TShape extends Shape> extends BaseSchema<InferShape<TShape>> {
  constructor(private readonly shape: TShape) {
    super((value) => {
      if (typeof value !== "object" || value === null) throw new Error("Invalid object");
      const record = value as Record<string, unknown>;
      const result = {} as InferShape<TShape>;
      for (const key of Object.keys(shape) as Array<keyof TShape>) {
        result[key] = shape[key].parse(record[String(key)]) as InferShape<TShape>[typeof key];
      }
      return result;
    });
  }

  refine(predicate: (data: InferShape<TShape>) => boolean, _options?: { message?: string; path?: string[] }): ObjectSchema<TShape> {
    return new ObjectSchema(this.shape).pipe((value) => {
      if (!predicate(value)) throw new Error("Refinement failed");
      return value;
    });
  }

  private pipe(transform: (value: InferShape<TShape>) => InferShape<TShape>): ObjectSchema<TShape> {
    return new (class extends ObjectSchema<TShape> {
      parse(value: unknown): InferShape<TShape> {
        return transform(super.parse(value));
      }
    })(this.shape);
  }
}

class NativeEnumSchema<TEnum extends Record<string, string | number>> extends BaseSchema<TEnum[keyof TEnum]> {}

export const z = {
  string: () =>
    new StringSchema((value) => {
      if (typeof value !== "string") throw new Error("Expected string");
      return value;
    }),
  boolean: () =>
    new BooleanSchema((value) => {
      if (typeof value !== "boolean") throw new Error("Expected boolean");
      return value;
    }),
  nativeEnum: <TEnum extends Record<string, string | number>>(enumObject: TEnum) =>
    new NativeEnumSchema<TEnum>((value) => {
      if (!Object.values(enumObject).includes(value as TEnum[keyof TEnum])) throw new Error("Invalid enum value");
      return value as TEnum[keyof TEnum];
    }),
  object: <TShape extends Shape>(shape: TShape) => new ObjectSchema(shape),
};
