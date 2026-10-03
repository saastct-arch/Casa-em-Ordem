-- Casa em Ordem — boleto como forma de pagamento
--
-- Boleto é à vista para efeito de fatura: não tem cartão nem competência,
-- então a trigger `saidas_competencia` já o trata como qualquer pagamento
-- fora do crédito. Só a lista de valores aceitos precisava crescer.

alter table saidas drop constraint saidas_forma_pagamento_check;
alter table saidas add constraint saidas_forma_pagamento_check
  check (forma_pagamento in ('dinheiro','debito','pix','credito','boleto'));
