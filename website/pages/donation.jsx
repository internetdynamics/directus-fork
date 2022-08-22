import { Fragment } from "react";
import { useSession } from "next-auth/react";
import DonationForm from "./donation-form";
import vcWebsite from "../lib/VCWebsite";

const Donation = () => {
  const { status } = useSession();

  return (
    <div>
      <div className="prose max-w-5xl container px-6 py-10 mx-auto">
        <h1>Donate</h1>
        <p>Thank you for your interest in donating to Virtual Christianity.</p>
        <p>
          We are a U.S. 501(c)(3) non-profit corporation. This means that your
          donations are deductible from your income on your annual US tax
          returns, so your donations can go farther.
        </p>
        <ul>
          <li>
            <strong>Zelle</strong>: The best way to send amounts of $500 or less
            is by Zelle to donations@virtualchristianity.org.
          </li>
          <li>
            <strong>Wire/Check</strong>: The best ways to donate larger amounts
            with low fees are with a wire transfer or by check.
          </li>
          <li>
            <strong>CashApp</strong>: You can send money using CashApp to
            $virtualchristianity for no fee.
          </li>
          <li>
            <strong>Venmo</strong>: For convenience, you can use Venmo to
            @virtualchristianity for a small fee.
          </li>
          <li>
            <strong>PayPal</strong>: You can send money using PayPal to
            $virtualchristianity for no fee.
          </li>
        </ul>
        <p>
          <strong>Important</strong>: Donations to Virtual Christianity are tax
          deductible. However, if you are paying for a course or for paid
          membership to a private area of a teacher&apos;s website, this is not
          tax deductible.
        </p>
        {status === "authenticated" && status !== "loading" && (
          <DonationForm></DonationForm>
        )}
        {status !== "authenticated" && status !== "loading" && (
          <Fragment>
            <ol>
              <li>
                <strong>Send Email</strong>: Whatever method you use to donate,
                please send an email to us at donations@virtualchristianity.org
                stating information about yourself (the donor), the amount you
                would like to donate, the date on which you plan to send it,
                confirmation of the purpose of the payment, what method you will
                use to donate (zelle, wire, check, venmo), and the project for
                which the funds are being donated (if any). Copy the following
                section into the email and fill out the information.
              </li>
            </ol>
            <pre className="h-64">
              <code>
                Donor Name:
                <br />
                Donor Address:
                <br />
                Donor Phone:
                <br />
                Donor Email:
                <br />
                Donation Amount:
                <br />
                Donation Date:
                <br />
                Payment Purpose: (donation, payment)
                <br />
                Donation Method: (zelle, wire, check, cashapp, venmo, paypal)
                <br />
                Project: (optional)
              </code>
            </pre>

            <ol start="2">
              <li>
                <strong>Sign Up as a User</strong>: Please also sign up as a
                user on this Virtual Christianity web site by clicking the
                &quot;Log In / Sign Up&quot; button in the upper right. This
                will (soon) allow you to see the record of your donations.
              </li>
              <li>
                <strong>Send Donation</strong>: Then send the donation using the
                selected donation method as described further below.
              </li>
            </ol>
          </Fragment>
        )}
        <h2>Zelle</h2>
        <p>
          Zelle is a common way within the U.S. to send money with no fees. Your
          bank and your bank app most likely already support this as a way to
          send money. Send your donation on Zelle to
          donations@virtualchristianity.org. (You may be limited to sending $500
          per week via Zelle.)
        </p>
        <h2>Wire Transfer</h2>
        <p>
          Wire Transfer is best for large sums of money with low fees. After you
          have sent us the above-mentioned email, call us at 770-639-3267 to get
          the wire transfer information. This includes the Routing Number and
          the Account Number for Virtual Christianity. Fees for wire transfers
          vary by bank, but they can typically be a flat $10 fee for next day
          delivery of a donation of any size.
        </p>
        <h2>Check</h2>
        <p>
          You can also mail us a check. This doesn&apos;t have any fees, but it
          is a bit more manual processing. If you want the funds to be directed
          to a specific Virtual Christianity project, please include that in the
          memo field on the check. Then send the check to us at:
        </p>
        <pre>
          <code>
            Virtual Christianity
            <br />
            320 Woodstone Dr.
            <br />
            Marietta, GA 30068
          </code>
        </pre>
        <h2>CashApp</h2>
        <p>
          You can send your donation on CashApp to $virtualchristianity. CashApp
          does not charge a fee. Most people use CashApp on their phones. You
          need to install the app, have a CashApp account, and have it linked to
          your bank account.
        </p>
        <h2>Venmo</h2>
        <p>
          You can send your donation on Venmo to @virtualchristianity. Venmo
          charges a fee of 1.9% + $0.10 for transfers to non-profit
          corporations. Most people use Venmo on their phones. You need to
          install the app, have a CashApp account, and have it linked to your
          bank account.
        </p>
        <h2>PayPal</h2>
        <p>
          You can send your donation on PayPal to
          donations@virtualchristianity.org. You can either use the PayPal app
          on your phone or access the PayPal website (https://www.paypal.com).
          You need to have a PayPal account. Then you can link it to your bank
          account for no fees or you can pay by credit card for a standard
          credit card fee (~ 2%).
        </p>
        <p>
          When you are donating money, you are <strong>not</strong> &quot;Paying
          for an item or service&quot; (which would deduct fees). When donating
          on the PayPal website, make sure to change this to &quot;Sending to a
          friend&quot;, which will deduct no fees. Donations are tax deductible.
        </p>
        <p>
          If however, you are paying for a course or for paid membership to a
          private area of a teacher&apos;s website, you are indeed &quot;Paying
          for an item or service.&quot; Some fees are deducted, and the sum of
          money is not a tax deductible donation.
        </p>
      </div>
    </div>
  );
};

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);
  return { props: props };
}

export default Donation;
