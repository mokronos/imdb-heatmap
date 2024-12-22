import { Component, Show } from 'solid-js';

const Episode: Component = (episode) => {
    // The provided colorValue function
    const colorValue = (rating) => {
        let backgroundColor;
        let color;
        const cutoff = 6;
        if (rating > cutoff) {
            rating -= cutoff;
            backgroundColor = `hsl(${(rating / (10 - cutoff)) * 120}, 100%, 50%)`;
            color = "black"; // Text color for light backgrounds
        } else {
            backgroundColor = `hsl(0, 100%, ${(rating / cutoff) * 50}%)`;
            color = "white"; // Text color for dark backgrounds
        }
        return [backgroundColor, color];
    };

    // Get background and text color
    const [backgroundColor, textColor] = colorValue(episode.rating);

    return (
        <Show when={episode.id} keyed>
        <td
            class="border border-slate-300 p-2 text-center"
            style={{
                background: backgroundColor,
                color: textColor,
            }}
        >
            <a
                href={`https://www.imdb.com/title/${episode.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: textColor }} // Ensure the link text is readable
            >
                {episode.rating.toFixed(1)}
            </a>
        </td>
        </Show>
    );
};

export default Episode;
