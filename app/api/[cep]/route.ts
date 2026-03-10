import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> }
) {
  const { cep } = await context.params;
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar o serviço de CEP." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cep: data.cep ?? "",
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      localidade: data.localidade ?? "",
      uf: data.uf ?? "",
    });
  } catch (error) {
    console.error("Erro na rota /api/cep:", error);

    return NextResponse.json(
      { error: "Falha ao consultar CEP." },
      { status: 500 }
    );
  }
}