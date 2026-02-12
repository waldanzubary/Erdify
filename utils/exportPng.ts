import { toPng } from 'html-to-image';

export async function exportToPng(element: HTMLElement, filename: string = 'erdify-diagram') {
    try {
        const dataUrl = await toPng(element, {
            backgroundColor: '#09090b',
            quality: 1,
            pixelRatio: 2,
            filter: (node) => {
                // Exclude React Flow controls and minimap from export
                const exclusions = ['react-flow__controls', 'react-flow__minimap'];
                return !exclusions.some((cls) =>
                    (node as HTMLElement)?.classList?.contains(cls)
                );
            },
        });

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}.png`;
        a.click();
    } catch (error) {
        console.error('Export to PNG failed:', error);
        throw error;
    }
}
