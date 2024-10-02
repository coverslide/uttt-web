class GlobalEventTarget extends EventTarget {
  private static instance: GlobalEventTarget | undefined;

  public constructor() {
    super();
    if (GlobalEventTarget.instance != null) {
      throw new Error("constructor called on singleton");
    }
  }

  public static getInstance(): GlobalEventTarget {
    if (GlobalEventTarget.instance == null) {
      GlobalEventTarget.instance = new GlobalEventTarget();
    }
    return GlobalEventTarget.instance as GlobalEventTarget;
  }
}

export default GlobalEventTarget;
