import { expect, test, jest } from "bun:test";
import FilterPanel from "./FilterPanel";
import { INITIAL_FILTERS } from "../constants/filters";

// Helper to find a node in the React element tree
function findNode(node, predicate) {
  if (!node) return null;
  if (predicate(node)) return node;
  if (node.props && node.props.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children.flat()
      : [node.props.children];
    for (const child of children) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

test("FilterPanel should call setFilters with INITIAL_FILTERS when reset button is clicked", () => {
  const mockSetFilters = jest.fn();
  const props = {
    filters: INITIAL_FILTERS,
    setFilters: mockSetFilters
  };

  // Render the component (as a plain function returning React elements)
  const element = FilterPanel(props);

  // Find the "Reset All" button more robustly
  const resetButton = findNode(element, (node) =>
    node.type === "button" && node.props.children === "Reset All"
  );

  expect(resetButton).not.toBeNull();

  // Call the onClick handler
  resetButton.props.onClick();

  expect(mockSetFilters).toHaveBeenCalledWith(INITIAL_FILTERS);
});
