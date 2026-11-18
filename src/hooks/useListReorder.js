import { useRef, useState } from 'react';

export default function useListReorder(getEntries, setEntries) {
  const dragged = useRef(null);
  const [dropTarget, setDropTarget] = useState(null);

  function move(id, targetId) {
    const entries = [...getEntries()];
    const from = entries.findIndex(entry => entry.id === id);
    const to = entries.findIndex(entry => entry.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [entry] = entries.splice(from, 1);
    entries.splice(to, 0, entry);
    setEntries(entries);
  }

  function reset() {
    dragged.current = null;
    setDropTarget(null);
  }

  return {
    itemProps: id => ({
      className: dropTarget === id ? 'attack-drop-target' : undefined,
      onDragOver: event => {
        if (dragged.current === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(id);
      },
      onDragLeave: event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null);
      },
      onDrop: event => {
        if (dragged.current === null) return;
        event.preventDefault();
        move(dragged.current, id);
        reset();
      },
    }),
    handleProps: item => ({
      draggable: true,
      'aria-label': `Reorder ${item.name}`,
      title: 'Drag to reorder, or use the up and down arrow keys',
      onDragStart: event => {
        dragged.current = item.id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
        event.dataTransfer.setDragImage(event.currentTarget.closest('li'), 0, 0);
      },
      onDragEnd: reset,
      onKeyDown: event => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const entries = getEntries();
        const index = entries.findIndex(entry => entry.id === item.id);
        const target = entries[index + (event.key === 'ArrowUp' ? -1 : 1)];
        if (target) move(item.id, target.id);
      },
    }),
  };
}
