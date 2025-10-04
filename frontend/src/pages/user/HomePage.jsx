import StatCard from "@/components/common/StatCard";
import { BookCheck, BookOpen, IndianRupee, Heart } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import BookCard from "@/components/common/BookCard";
import Loader from "@/components/common/Loader";
import { useSelector } from "react-redux";

const HomePage = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [profileStats, setProfileStats] = useState({});
  const [loading, setLoading] = useState({
    featuredBooks: false,
    userStats: false,
  });
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [loadingCategoryBooks, setLoadingCategoryBooks] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchProfileStat = async () => {
      setLoading((prev) => ({ ...prev, userStats: true }));

      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("No access token found. Skipping profile stats fetch.");
        setLoading((prev) => ({ ...prev, userStats: false }));
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/profile/stats`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response?.data?.success) {
          setProfileStats(response.data.data);
        }
      } catch (error) {
        console.error(
          "Error fetching profile stats:",
          error.response?.data || error.message
        );
      } finally {
        setLoading((prev) => ({ ...prev, userStats: false }));
      }
    };

    const fetchFeaturedBooks = async () => {
      setLoading((prev) => ({ ...prev, featuredBooks: true }));

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/book/featuredBook`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setFeaturedBooks(response?.data.data);
      } catch (error) {
        console.error("Error fetching featured books:", error);
      } finally {
        setLoading((prev) => ({ ...prev, featuredBooks: false }));
      }
    };

    fetchProfileStat();
    fetchFeaturedBooks();
  }, []);

  const handleCategoryClick = async (category) => {
    if (category === activeCategory) {
      setActiveCategory(null);
      setCategoryBooks([]);
      return;
    }

    setActiveCategory(category);
    setLoadingCategoryBooks(true);

    try {
      let endpoint = '';
      switch (category) {
        case 'issued':
          endpoint = `${import.meta.env.VITE_BACKEND_URL}/borrow/issued-books`;
          break;
        case 'returned':
          endpoint = `${import.meta.env.VITE_BACKEND_URL}/borrow/returned-books`;
          break;
        case 'wishlist':
          endpoint = `${import.meta.env.VITE_BACKEND_URL}/wishlist`;
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response?.data?.success) {
        setCategoryBooks(response.data.data);
      }
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
    } finally {
      setLoadingCategoryBooks(false);
    }
  };

  return (
    <div className="px-4 flex flex-col gap-6 bg-zinc-100 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Welcome Banner */}
      <div className="w-full bg-white dark:bg-zinc-900 mt-6 rounded-2xl h-[10rem] flex items-center hover:shadow-md transition duration-200">
        <div className="flex flex-col gap-3 px-10">
          <h1 className="text-3xl font-bold capitalize">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Discover new books and manage your reading journey.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div onClick={() => handleCategoryClick('issued')} className="cursor-pointer">
          <StatCard
            icon={BookOpen}
            title="Issued"
            value={
              loading.userStats === true ? null : profileStats?.issuedBooksCount
            }
            color="blue"
            active={activeCategory === 'issued'}
          />
        </div>
        <div onClick={() => handleCategoryClick('returned')} className="cursor-pointer">
          <StatCard
            icon={BookCheck}
            title="Returned"
            value={
              loading.userStats === true ? null : profileStats?.returnedBooksCount
            }
            color="green"
            active={activeCategory === 'returned'}
          />
        </div>
        <div onClick={() => handleCategoryClick('wishlist')} className="cursor-pointer">
          <StatCard
            icon={Heart}
            title="Wishlist"
            value={
              loading.userStats === true ? null : profileStats?.wishlistCount
            }
            color="orange"
            active={activeCategory === 'wishlist'}
          />
        </div>
        <StatCard
          icon={IndianRupee}
          title="Total Fines"
          value={loading.userStats === true ? null : profileStats?.totalFines}
          color="red"
        />
      </div>

      {/* Category Books Display */}
      {activeCategory && (
        <div className="w-full rounded-2xl">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl flex flex-col items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-center text-zinc-900 dark:text-zinc-100 capitalize">
              {activeCategory} Books
            </h1>
          </div>

          {loadingCategoryBooks ? (
            <div className="flex justify-center my-10">
              <Loader width={9} height={40} />
            </div>
          ) : categoryBooks.length === 0 ? (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl text-center mb-6">
              <p className="text-zinc-600 dark:text-zinc-400">
                No {activeCategory} books found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {categoryBooks.map((book) => (
                <BookCard key={book?._id} bookData={book} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Books */}
      <div className="w-full mb-6 rounded-2xl">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl flex flex-col items-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-center text-zinc-900 dark:text-zinc-100 drop-shadow-md">
            Featured Books
          </h1>
          <p className="mt-2 text-customGray text-lg font-medium text-center max-w-md">
            Discover the most popular and highly rated books
          </p>
        </div>

        {loading.featuredBooks === true ? (
          <div className="flex justify-center my-10">
            <Loader width={9} height={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {featuredBooks?.map((book) => (
              <BookCard key={book?._id} bookData={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;