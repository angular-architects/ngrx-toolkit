export type Prettify<Type extends object> = {
  [Key in keyof Type]: Type[Key];
};
