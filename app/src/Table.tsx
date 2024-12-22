import { useParams } from '@solidjs/router';
import { createResource, Show, For, type Component} from 'solid-js';
import Episode from './Episode';

async function fetchShow(id: string) {
    const resp = await fetch(`/${id}.json`);
    return resp.json();
}

const Table: Component = () => {
    const params = useParams();
    const [show] = createResource(() => params.id, fetchShow);

    return (
        <>
            <Show when={params.id} keyed>
            <div class="overflow-x-auto">
                <Show when={!show.loading} fallback={<p>Loading...</p>}>
                    <Show when={!show.error}>
                    <table class="border-collapse border border-slate-400">
                        <thead>
                            <tr>
                                <th class="border border-slate-300 p-2">S/E</th>
                                <For each={show()?.[0]}>
                                    {(_, index) => (
                                        <th class="border border-slate-300 p-2">{index() + 1}</th>
                                    )}
                                </For>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={show()}>
                                {(season, seasonIndex) => (
                                    <tr>
                                        <th class="border border-slate-300 p-2">{seasonIndex() + 1}</th>
                                        <For each={season}>
                                            {(episode) => (
                                                Episode(episode)
                                            )}
                                        </For>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                    </Show>
                </Show>
            </div>
            </Show>
        </>
    );
};

export default Table;
