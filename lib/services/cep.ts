export type CepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export async function fetchAddressByCep(cep: string): Promise<CepResponse> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

  if (!response.ok) {
    throw new Error("Erro ao consultar CEP.");
  }

  const data: CepResponse = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return data;
}