import React from 'react';

// Termos de Uso e Política de Privacidade. Texto base escrito para o funcionamento real
// do app (Neon, R2, OpenAI, Stripe, Vercel); revisar com advogado antes de escalar.
const ATUALIZADO = '27 de setembro de 2026';
const CONTATO = 'WhatsApp (54) 98143-2889';

const Pagina: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <article className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8 space-y-4 text-gray-700 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
    <h1 className="text-3xl font-bold text-gray-900">{titulo}</h1>
    <p className="text-sm text-gray-500">Atualizado em {ATUALIZADO}.</p>
    {children}
  </article>
);

export const Termos: React.FC = () => (
  <Pagina titulo="Termos de Uso">
    <p>
      O Estilo Virtual é um serviço da Seckler Digital que usa inteligência artificial para gerar imagens de
      catálogo (flat lays) e simulações de roupas no corpo de uma pessoa (provador virtual). Ao criar uma conta,
      você concorda com estes termos.
    </p>

    <h2>1. Conta</h2>
    <ul>
      <li>Você é responsável pelo acesso à sua conta e pelas imagens geradas nela.</li>
      <li>Uma conta por pessoa ou loja. Contas criadas para acumular créditos grátis podem ser encerradas.</li>
    </ul>

    <h2>2. Créditos e planos</h2>
    <ul>
      <li>Cada imagem gerada consome 1 crédito. Se a geração falhar, o crédito é devolvido.</li>
      <li>Toda conta nova recebe 3 créditos grátis, uma única vez.</li>
      <li>
        Os planos são assinaturas mensais cobradas pelo Stripe. Os créditos do plano renovam a cada mês e não
        acumulam de um mês para o outro.
      </li>
      <li>
        O plano Ilimitado segue uma política de uso justo de até 2.000 imagens por mês, para garantir o serviço a
        todos os clientes.
      </li>
      <li>
        Você pode cancelar quando quiser em Minha conta. O acesso segue até o fim do período já pago; não há
        reembolso proporcional de meses iniciados.
      </li>
      <li>Nos planos Grátis e Essencial, as imagens saem com a marca d'água "EstiloVirtual".</li>
    </ul>

    <h2>3. Uso permitido</h2>
    <p>É proibido usar o Estilo Virtual para:</p>
    <ul>
      <li>enviar fotos de outra pessoa sem a autorização dela;</li>
      <li>enviar fotos de menores de 18 anos;</li>
      <li>gerar conteúdo sexual, ofensivo, discriminatório ou que engane terceiros (por exemplo, se passar por outra pessoa);</li>
      <li>violar direitos autorais ou de imagem de marcas e pessoas.</li>
    </ul>
    <p>
      Pedidos podem ser recusados automaticamente pelas regras de segurança do provedor de IA. Contas que violarem
      estas regras podem ser suspensas.
    </p>

    <h2>4. Sobre as imagens geradas</h2>
    <ul>
      <li>
        As imagens são simulações feitas por IA. Elas mostram como uma peça pode ficar, mas não garantem tamanho,
        caimento ou cor exatos.
      </li>
      <li>Você pode usar as imagens que gerou na divulgação da sua loja.</li>
      <li>
        Se você usa o provador com clientes da sua loja, é sua responsabilidade pedir a autorização delas para usar
        as fotos.
      </li>
    </ul>

    <h2>5. Disponibilidade e responsabilidade</h2>
    <p>
      O serviço depende de provedores externos (IA, armazenamento e pagamentos) e pode ter interrupções. A
      responsabilidade da Seckler Digital fica limitada ao valor pago nos últimos 3 meses.
    </p>

    <h2>6. Mudanças e contato</h2>
    <p>
      Podemos atualizar estes termos; mudanças importantes serão avisadas por e-mail. Dúvidas: {CONTATO}.
    </p>
  </Pagina>
);

export const Privacidade: React.FC = () => (
  <Pagina titulo="Política de Privacidade">
    <p>
      Esta política explica quais dados o Estilo Virtual (Seckler Digital) coleta, para quê e como você pode
      controlá-los, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
    </p>

    <h2>1. Dados que coletamos</h2>
    <ul>
      <li><strong>Conta:</strong> nome, e-mail e senha (guardada de forma criptografada).</li>
      <li><strong>Pagamento:</strong> feito pelo Stripe. Não vemos nem guardamos o número do seu cartão.</li>
      <li>
        <strong>Fotos enviadas:</strong> as fotos de roupas e de pessoas que você envia são usadas só para gerar a
        imagem pedida e <strong>não ficam guardadas</strong> por nós.
      </li>
      <li>
        <strong>Imagens geradas:</strong> ficam guardadas na sua conta (em "Minhas imagens") até você apagar ou
        excluir a conta. Podem conter o rosto de pessoas.
      </li>
      <li><strong>Uso:</strong> créditos gastos e datas das gerações, para controle do plano.</li>
    </ul>

    <h2>2. Com quem compartilhamos</h2>
    <p>Usamos estes fornecedores, alguns com servidores fora do Brasil:</p>
    <ul>
      <li>OpenAI: processa as fotos para gerar as imagens;</li>
      <li>Cloudflare (R2): guarda as imagens geradas;</li>
      <li>Neon: banco de dados e login;</li>
      <li>Stripe: pagamentos;</li>
      <li>Vercel: hospedagem do site.</li>
    </ul>
    <p>Não vendemos seus dados.</p>

    <h2>3. Fotos de pessoas</h2>
    <p>
      Antes de usar o provador, você confirma que a foto é sua ou que a pessoa fotografada autorizou o uso, e que
      ela é maior de idade. Quando o provador é usado por clientes de uma loja, a loja é a responsável por esse
      consentimento.
    </p>

    <h2>4. Cookies</h2>
    <p>Usamos apenas o cookie de sessão necessário para manter você logado. Não usamos cookies de publicidade.</p>

    <h2>5. Seus direitos</h2>
    <ul>
      <li>ver e corrigir seus dados em Minha conta;</li>
      <li>apagar qualquer imagem em "Minhas imagens";</li>
      <li>excluir a conta em Minha conta, o que apaga suas imagens e dados de uso e cancela a assinatura;</li>
      <li>tirar dúvidas ou fazer pedidos pelo {CONTATO}.</li>
    </ul>
  </Pagina>
);
