import { useState, useEffect, useCallback } from 'react';
import { AppData } from '../types';
import { getAppData, saveAppData } from '../lib/db';

/**
 * Hook customizado para gerenciar o estado global da aplicação (`AppData`).
 * 
 * Este hook encapsula a lógica de interação com o IndexedDB (`getAppData`, `saveAppData`),
 * fornecendo uma interface reativa para os componentes. Ele lida com o estado de
 * carregamento inicial e possíveis erros durante as operações de dados.
 *
 * @returns Um objeto contendo:
 *  - `data`: O estado atual dos dados da aplicação (`AppData`), ou `null` durante o carregamento inicial ou em caso de erro.
 *  - `loading`: Um booleano que é `true` apenas durante a busca inicial dos dados.
 *  - `error`: Um objeto `Error` se ocorrer uma falha ao buscar ou salvar dados, caso contrário, `null`.
 *  - `updateAppData`: Uma função memoizada para atualizar os dados da aplicação. Ela realiza uma
 *    atualização otimista da interface e, em seguida, persiste os novos dados no IndexedDB.
 */
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Efeito para carregar os dados do IndexedDB na montagem do componente.
   * A flag `isMounted` previne atualizações de estado em um componente desmontado.
   */
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const storedData = await getAppData();
        if (isMounted) {
          setData(storedData);
        }
      } catch (e) {
        if (isMounted) {
          setError(e as Error);
        }
        console.error("Failed to load data from IndexedDB", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Função para atualizar os dados da aplicação.
   * Utiliza `useCallback` para garantir que a função tenha uma referência estável,
   * evitando re-renderizações desnecessárias em componentes filhos.
   *
   * @param newData O novo objeto `AppData` completo a ser salvo.
   */
  const updateAppData = useCallback(async (newData: AppData) => {
    // Atualização Otimista: A interface é atualizada imediatamente
    // para uma experiência de usuário mais fluida.
    setData(newData);
    try {
      // Tenta salvar os dados no banco de dados.
      await saveAppData(newData);
    } catch (e) {
      // Se a persistência falhar, define o estado de erro.
      setError(e as Error);
      console.error("Failed to save data to IndexedDB", e);
      // Em uma aplicação mais complexa, poderia-se reverter o estado
      // para o `data` anterior ou exibir uma mensagem de erro persistente.
    }
  }, []);

  return { data, loading, error, updateAppData };
}
