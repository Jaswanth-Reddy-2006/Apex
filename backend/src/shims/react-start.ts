export function createServerFn(options: { method: "GET" | "POST" }) {
  let middlewareChain: any[] = [];
  let validatorFn: any = null;

  const builder = {
    middleware: (fns: any[]) => {
      middlewareChain = fns;
      return builder;
    },
    inputValidator: (fn: any) => {
      validatorFn = fn;
      return builder;
    },
    handler: (handlerFn: any) => {
      const serverFn = async (input: any) => {
        let context: any = {};

        // Execute middleware chain sequentially
        for (const middleware of middlewareChain) {
          let nextContext = {};
          await middleware({
            next: (args?: { context?: any }) => {
              if (args?.context) {
                nextContext = args.context;
              }
              return Promise.resolve();
            },
          });
          context = { ...context, ...nextContext };
        }

        // Extract the payload (TanStack Start wraps client calls in { data: payload })
        const payload = input && typeof input === "object" && "data" in input ? input.data : input;

        // Validate inputs if a validator exists
        let validatedInput = payload;
        if (validatorFn) {
          validatedInput = validatorFn(payload);
        }

        // Execute core handler
        return handlerFn({ data: validatedInput, context });
      };

      (serverFn as any).options = options;
      (serverFn as any).middleware = middlewareChain;
      (serverFn as any).handler = handlerFn;
      return serverFn;
    },
  };
  return builder;
}

export function createMiddleware(options?: any) {
  const builder = {
    server: (fn: any) => {
      return fn;
    },
  };
  return builder;
}
