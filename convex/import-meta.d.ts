interface ImportMeta {
	glob(padrao: string): Record<string, () => Promise<unknown>>;
}
