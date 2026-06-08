import type { Component } from 'solid-js';
import { createEffect, createResource, createMemo, createSignal, For, Index, Show, Suspense, useTransition, Match, Switch } from 'solid-js';

import NumberBox from './NumberBox';
import { useParams } from '@solidjs/router';
import { prepareData } from './utils';

type ShowMeta = {
    id: string;
    title: string;
    startYear?: string;
    displayTitle?: string;
};

const emptyShow: ShowMeta = {"id": "", "title": ""};

function getDisplayTitle(show: ShowMeta) {
    return show.displayTitle ?? show.title;
}

function getPosterUrl(id: string) {
    return `https://images.metahub.space/poster/medium/${id}/img`;
}

const App: Component = (props) => {

    async function fetchShow(id: string) {
        if (!id) {
            return;
        }
        const resp = await fetch(`/${id}.json`);
        return resp.json();
    }

    async function fetchShowMetas() {
        const resp = await fetch(`/titleId.json`);
        return resp.json();
    }

    const [currentShow, setShow] = createSignal<ShowMeta>(emptyShow);
    const [query, setQuery] = createSignal("");
    const [showData] = createResource(() => currentShow().id, fetchShow);
    const [showMetas] = createResource(fetchShowMetas);

    const filteredMetas = () => {

        if (query() == "") {
            return [];
        }
        if (showMetas()) {
            return showMetas().filter((show: ShowMeta) => {
                const searchText = `${getDisplayTitle(show)} ${show.id}`.toLowerCase();
                return searchText.includes(query().toLowerCase());
            }).slice(0, 5);
        }

    }

    createEffect(() => {
        var id = useParams().id
        if (id && showMetas()) {
            setShow(showMetas().find((show: ShowMeta) => show.id == id) ?? emptyShow)
        }
        console.log(id)
        console.log(currentShow())
    })

    var prevData = null;


    const preppedData = () => {
        if (showData()) {
            var prepData = prepareData(showData(), prevData);
            prevData = showData();
            return prepData;
        }
        return null;
    };

    return (
        <div class="h-screen overflow-y-scroll">
            <input placeholder="Search for TV show" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-black" list="search" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
            <For each={filteredMetas()} fallback={<p>Loading...</p>}>
                {(show) => (
                    <>
                        <li class="content-center py-2 list-none">
                            <a href={`/${show.id}`} class="inline-flex items-center gap-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                <img src={getPosterUrl(show.id)} alt={`${show.title} poster`} class="h-16 w-11 rounded object-cover bg-neutral-800" loading="lazy" />
                                <span>{getDisplayTitle(show)}</span>
                            </a>
                        </li>
                    </>
                )}
            </For>

            <Show when={currentShow().id}>
                <div class="flex items-center gap-4 py-4">
                    <img src={getPosterUrl(currentShow().id)} alt={`${currentShow().title} poster`} class="h-28 w-20 rounded object-cover bg-neutral-800" />
                    <div>Current Show: {getDisplayTitle(currentShow())}</div>
                </div>
            </Show>

            <For each={preppedData()}>
                {(row) => (
                    <>
                        <div class="flex flex-none">
                            <For each={row}>
                                {(cell) => (
                                    <div class="w-10 h-10 flex-none text-black m-[0.5px]">
                                        <Switch>
                                            <Match when={cell.type === "episode"}>
                                                <NumberBox id={cell.new.id??""} number={cell.new.rating??0} previousNumber={cell.old.rating??0} steps={3} duration={200} />
                                            </Match>
                                            <Match when={cell.type === "seasondesc"}>
                                                <Show when={cell.new > 0} fallback={<div></div>}>
                                                    <div class="bg-neutral-700 text-center w-full h-full place-content-center text-center"> {cell.new} </div>
                                                </Show>
                                            </Match>
                                            <Match when={cell.type === "episodedesc"}>
                                                <Show when={cell.new > 0} fallback={<div></div>}>
                                                    <div class="bg-neutral-700 w-full h-full place-content-center text-center"> {cell.new} </div>
                                                </Show>
                                            </Match>
                                            <Match when={cell.type === "corner"}>
                                                <div class="bg-neutral-600 w-full h-full place-content-center text-center"> {cell.value} </div>
                                            </Match>
                                        </Switch>
                                    </div>
                                )}
                            </For>
                        </div>
                    </>
                )}
            </For>
        </div>
    );
}

export default App;
