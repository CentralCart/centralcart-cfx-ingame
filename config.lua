CentralCart = {
  
  framework = "auto",
  -- Frameworks suportadas: vrp, vrp-default, vrp-creative_3, vrp-creative_4, vrp-creative_5, vrp-creative_network, qbcore
  -- auto  -> o sistema tentará detectar qual framework você utiliza
  -- blank -> use caso nenhuma acima seja o seu caso

  store = "", -- "https://seudominio.centralcart.com.br/"
  command = "loja", -- comando para abrir a loja
  template = "default", -- "default" / único template disponível atualmente
  colors = {
    primary = '', -- apenas insira caso queira personalizar uma cor primária diferente da sua loja
    muted = '', -- apenas insira caso queira personalizar uma cor muted do script
    background = '', -- apenas insira caso queira personalizar uma cor de fundo do script
  },

  -- Apenas para framework = "blank"
  -- Insira abaixo a função que retorna o ID do jogador na sua base
  -- O parâmetro "source" é o server ID do jogador
  customGetPlayerId = function(source)
    -- Exemplo: return exports['seurecurso']:getPlayerId(source)
    -- Exemplo: return yourFramework.getUserId(source)
    return nil
  end,

}