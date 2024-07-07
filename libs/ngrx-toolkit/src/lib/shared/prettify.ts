export type Prettify<Type extends {}> = {
  [Key in keyof Type]: Type[Key];
};
