import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import NavMenu from "../components/navmenu/index";

export default function WebsiteNavbar({ website }) {
  if (!website) website = {};

  const [menuOpen, setMenuOpen] = useState(false);
  const { status } = useSession();

  return (
    <div className="relative bg-white">
      <div className="bg-black mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center border-b-2 border-black py-4 lg:justify-start lg:space-x-0">
          {website.landscapeLogo && (
            <div className="flex justify-start basis-[10%] text-white">
              <Link href="/" passHref>
                <a className="h-10 w-40">
                  <img
                    width="144"
                    height="40"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      website.landscapeLogo.filename_disk
                    }
                  />
                </a>
              </Link>
            </div>
          )}

          <div className="-mr-2 -my-2 lg:hidden flex">
            <div>
              <button
                type="button"
                className="mr-4 bg-white rounded-md p-2 inline-flex items-center justify-end text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-expanded="false"
                onClick={() => setMenuOpen(true)}
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            {status === "authenticated" && (
              <div className=" -my-2 mr-2 inline-flex items-center justify-end">
                <NavMenu></NavMenu>
              </div>
            )}
          </div>
          {status === "authenticated" && status !== "loading" && (
            <>
              <div className="hidden lg:flex basis-[80%] items-center justify-center">
                {website.pages && (
                  <>
                    {website.pages.map((navPage, index) => {
                      if (navPage.isPrimaryNav) {
                        return (
                          <div key={index}>
                            <Link href={navPage.pagePath} passHref>
                              <a className="mr-6 text-base font-medium text-white hover:text-indigo-300">
                                {navPage.pageShortName}
                              </a>
                            </Link>
                          </div>
                        );
                      }
                    })}
                  </>
                )}
                <Link href="/email-contact" passHref>
                  <a
                    className="mr-6 text-base font-medium text-white hover:text-indigo-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Contact Us
                  </a>
                </Link>
                <Link href="/donation" passHref>
                  <a
                    className="mr-6 text-base font-medium text-white hover:text-indigo-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Donate
                  </a>
                </Link>
              </div>

              <div className="hidden lg:flex basis-[10%] items-center justify-end">
                <NavMenu></NavMenu>
              </div>
            </>
          )}
          {status !== "authenticated" && status !== "loading" && (
            <>
              <div className="hidden lg:flex basis-[80%] items-center justify-center">
                {website.pages && (
                  <>
                    {website.pages.map((navPage, index) => {
                      if (navPage.isPrimaryNav && !navPage.isLoginRequired) {
                        return (
                          <div key={index}>
                            <Link href={navPage.pagePath} passHref>
                              <a className="mr-6 text-base font-medium text-white hover:text-indigo-300">
                                {navPage.pageShortName}
                              </a>
                            </Link>
                          </div>
                        );
                      }
                    })}
                  </>
                )}
                <Link href="/email-contact" passHref>
                  <a
                    className="mr-6 text-base font-medium text-white hover:text-indigo-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Contact Us
                  </a>
                </Link>
                <Link href="/donation" passHref>
                  <a
                    className="mr-6 text-base font-medium text-white hover:text-indigo-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Donate
                  </a>
                </Link>
              </div>
              <div className="hidden lg:flex basis-[10%] items-center justify-end">
                <Link href="/sign-in" passHref>
                  <a className="whitespace-nowrap text-base font-medium text-white hover:text-indigo-300">
                    Sign In
                  </a>
                </Link>
                <Link href="/request-sign-up" passHref>
                  <a className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-2 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-black bg-white hover:text-indigo-500">
                    Sign Up
                  </a>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={`absolute top-0 inset-x-0 p-2 transition transform origin-top-right lg:hidden z-50 ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
          <div className="pt-5 pb-6 px-5">
            <div className="flex items-center justify-between text-white">
              {website.footerLandscapeLogo && (
                <div>
                  <Link href="/" passHref>
                    <a className="h-10 w-48" onClick={() => setMenuOpen(false)}>
                      <img
                        width="140"
                        height="38"
                        src={
                          website.baseApiUrl +
                          "/assets/" +
                          website.footerLandscapeLogo.filename_disk
                        }
                      />
                    </a>
                  </Link>
                </div>
              )}
              <div className="-mr-2">
                <button
                  type="button"
                  className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="py-6 px-5 space-y-6 bg-gray-100">
            {status === "authenticated" && status !== "loading" && (
              <>
                {website.pages && (
                  <>
                    {website.pages.map((navPage, index) => {
                      if (navPage.isPrimaryNav) {
                        return (
                          <div key={index}>
                            <div className="flex items-center p-1">
                              <Link href={navPage.pagePath} passsHref>
                                <a
                                  className="whitespace-nowrap text-xl text-gray-800 min-w-full"
                                  onClick={() => setMenuOpen(false)}
                                >
                                  {navPage.pageShortName}
                                </a>
                              </Link>
                              {/* <div className="ml-auto">
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                              </div> */}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </>
                )}
                <div className="min-w-full" onClick={() => setMenuOpen(false)}>
                  <Link href="/email-contact" passHref>
                    <a className="p-1 pt-6 whitespace-nowrap text-xl text-gray-800">
                      Contact Us
                    </a>
                  </Link>
                </div>
                <div className="min-w-full" onClick={() => setMenuOpen(false)}>
                  <Link href="/donation" passHref>
                    <a className="p-1 pt-6 whitespace-nowrap text-xl text-gray-800">
                      Donate
                    </a>
                  </Link>
                </div>
              </>
            )}
            {status !== "authenticated" && status !== "loading" && (
              <div>
                <Link href="/request-sign-up" passHref>
                  <a
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:bg-gray-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </a>
                </Link>
                <div className="mt-6 text-center text-base font-medium text-gray-500">
                  Existing user?{" "}
                  <Link href="/sign-in" passHref>
                    <a
                      className="text-gray-400 hover:text-gray-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </a>
                  </Link>
                </div>
                <div>
                  {website.pages && (
                    <>
                      {website.pages.map((navPage, index) => {
                        if (navPage.isPrimaryNav && !navPage.isLoginRequired) {
                          return (
                            <div key={index}>
                              <div className="flex items-center p-3">
                                <Link href={navPage.pagePath} passHref>
                                  <a
                                    className="whitespace-nowrap  text-xl text-gray-800 min-w-full"
                                    onClick={() => setMenuOpen(false)}
                                  >
                                    {navPage.pageShortName}
                                  </a>
                                </Link>
                                {/* <div className="ml-auto">
                                <svg
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                                </svg>
                              </div> */}
                              </div>
                            </div>
                          );
                        }
                      })}
                      <div
                        className="min-w-full p-3"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Link href="/email-contact" passHref>
                          <a className="whitespace-nowrap text-xl text-gray-800">
                            Contact Us
                          </a>
                        </Link>
                      </div>
                      <div
                        className="min-w-full p-3 "
                        onClick={() => setMenuOpen(false)}
                      >
                        <Link href="/donation" passHref>
                          <a className="whitespace-nowrap text-xl text-gray-800">
                            Donate
                          </a>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
