import React from 'react';

const CategoryFilter = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="flex flex-wrap mb-4 gap-2">
      <button
        className={`px-3 py-1 text-sm rounded-full ${
          activeCategory === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}
        onClick={() => setActiveCategory('all')}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`px-3 py-1 text-sm rounded-full ${
            activeCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
