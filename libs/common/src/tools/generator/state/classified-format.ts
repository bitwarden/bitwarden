import { Jsonify } from "type-fest";

/** Describes the structure of data stored by the SecretState's
 *  encrypted state. Notably, this interface ensures that `Disclosed`
 *  round trips through JSON serialization. It also preserves the
 *  Id.
 *  @remarks Tuple representation chosen because it matches
 *  `Object.entries` format.
 */
export type ClassifiedFormat<Id, Disclosed> = {
  /** Identifies records. `null` when storing a `value` */
  readonly id: Id | null;
  /** Serialized {@link EncString} of the secret state's
   *  secret-level classified data.
   */
  readonly secret: string;
  /** serialized representation of the secret state's
   * disclosed-level classified data.
   */
  readonly disclosed: Jsonify<Disclosed>;
};
