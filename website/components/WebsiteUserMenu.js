
export default function WebsiteUserMenu({ website }) {
    // console.log("XXX WebsiteUserMenu props", props);
    return (
        <div className="flex">
            <button className="p-1 block md:hidden text-white mr-1">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" className="h-8 w-auto" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                </svg>
            </button>
            <div className="hidden md:block">
                <a href="/login">
                    <div className="block w-full lg:w-auto text-center uppercase tracking-wide font-semibold text-base md:text-sm border-2 rounded-md px-6 py-2 text-white border-white hover:text-secondary-100">Log In</div>
                </a>
            </div>
        </div>
    )
}
