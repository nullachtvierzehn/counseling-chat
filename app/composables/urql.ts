import type { AnyVariables, TypedDocumentNode } from "@urql/core"
export { useQuery, useMutation } from "@urql/vue"

type MaybeRef<T> = T | (() => T) | Ref<T>;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type MaybeRefObj<T> = T extends {} ? {
    [K in keyof T]: MaybeRef<T[K]>;
} : T;

type InferVariablesFromQuery<R, V extends NonNullable<AnyVariables>> = {
  query: TypedDocumentNode<R, V>;
  variables: MaybeRef<MaybeRefObj<V>>;
}

type OtherFieldsOfUseQueryArgument = Omit<Parameters<typeof useQuery>[0], "query" | "variables">;

// https://github.com/urql-graphql/urql/issues/2152
export async function useTypedQuery<R, V extends NonNullable<AnyVariables>>({ query, variables, ...others }: InferVariablesFromQuery<R, V> & OtherFieldsOfUseQueryArgument) {
  return useQuery({ ...others, query, variables })
}
