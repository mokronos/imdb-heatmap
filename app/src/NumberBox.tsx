import { createSignal, createEffect, onMount, Show } from "solid-js";

const NumberBox = (props) => {


    const [displayNumber, setDisplayNumber] = createSignal(props.previousNumber);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const animateNumber = async (start, end, steps, duration) => {
        let current = start;
        const dir = start < end ? 1 : -1;
        const stepSize = Math.abs(end - start) / steps * dir;
        const timestep = duration / steps;

        let animation_ran = false;

        for (let i = 0; i < steps; i++) {
            await delay(timestep);
            current += stepSize;
            setDisplayNumber(current.toFixed(1));
            animation_ran = true;
        }
    };

    const getColor = (n) => {

        if (n == 0) {
            return `transparent`;
        }

        const cutoff = 6;
        if (n > cutoff) {
            n -= cutoff;
            return `hsl(${(n / (10 - cutoff)) * 120}, 100%, 50%)`;
        } else {
            return `hsl(0, 100%, ${(n / cutoff) * 50}%)`;
        }
    };


    onMount(() => {
        animateNumber(props.previousNumber, props.number, props.steps, props.duration);
    });

    return <div class="w-full h-full place-content-center text-center" style={{ "background-color": getColor(displayNumber()), "color": displayNumber() > 4 ? "black" : "white" }}>
        <Show when={displayNumber() != 0} fallback={<div></div>}>
        <a href={`https://www.imdb.com/title/${props.id}`}>{displayNumber()}</a>
        </Show>
    </div>;
};

export default NumberBox;
