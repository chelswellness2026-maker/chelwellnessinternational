<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';


/*
|--------------------------------------------------------------------------
| JSON RESPONSE
|--------------------------------------------------------------------------
*/

function reply(
    bool $success,
    string $message,
    int $status = 200
): never {

    http_response_code($status);

    echo json_encode([
        'success' => $success,
        'message' => $message
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| READ SMTP RESPONSE
|--------------------------------------------------------------------------
*/

function smtpRead($socket): string
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {

        $response .= $line;

        if (
            strlen($line) >= 4 &&
            $line[3] === ' '
        ) {
            break;
        }
    }

    return $response;
}


/*
|--------------------------------------------------------------------------
| SMTP RESPONSE CODE
|--------------------------------------------------------------------------
*/

function smtpCode(string $response): int
{
    return (int) substr($response, 0, 3);
}


/*
|--------------------------------------------------------------------------
| CHECK SMTP RESPONSE
|--------------------------------------------------------------------------
*/

function smtpExpect(
    $socket,
    array $allowedCodes
): void {

    $response = smtpRead($socket);

    $code = smtpCode($response);

    if (!in_array($code, $allowedCodes, true)) {

        throw new RuntimeException(
            'SMTP server rejected the request: ' .
            trim($response)
        );
    }
}


/*
|--------------------------------------------------------------------------
| SEND SMTP COMMAND
|--------------------------------------------------------------------------
*/

function smtpCommand(
    $socket,
    string $command,
    array $allowedCodes
): void {

    fwrite(
        $socket,
        $command . "\r\n"
    );

    smtpExpect(
        $socket,
        $allowedCodes
    );
}


/*
|--------------------------------------------------------------------------
| SEND EMAIL USING GMAIL SMTP
|--------------------------------------------------------------------------
*/

function smtpSendGmail(
    string $to,
    string $replyTo,
    string $subject,
    string $body
): void {

    $socket = @stream_socket_client(
        'tcp://' . SMTP_HOST . ':' . SMTP_PORT,
        $errno,
        $errstr,
        30
    );

    if (!$socket) {

        throw new RuntimeException(
            "Could not connect to Gmail SMTP: " .
            $errstr .
            " (" .
            $errno .
            ")"
        );
    }

    stream_set_timeout(
        $socket,
        30
    );


    try {

        /*
         * Gmail greeting
         */
        smtpExpect(
            $socket,
            [220]
        );


        /*
         * EHLO
         */
        smtpCommand(
            $socket,
            'EHLO localhost',
            [250]
        );


        /*
         * STARTTLS
         */
        fwrite(
            $socket,
            "STARTTLS\r\n"
        );

        smtpExpect(
            $socket,
            [220]
        );


        /*
         * Enable TLS
         */
        $crypto = stream_socket_enable_crypto(
            $socket,
            true,
            STREAM_CRYPTO_METHOD_TLS_CLIENT
        );


        if ($crypto !== true) {

            throw new RuntimeException(
                'Could not establish TLS encryption.'
            );
        }


        /*
         * EHLO again after TLS
         */
        smtpCommand(
            $socket,
            'EHLO localhost',
            [250]
        );


        /*
         * Gmail authentication
         */
        smtpCommand(
            $socket,
            'AUTH LOGIN',
            [334]
        );


        /*
         * Gmail email address
         */
        smtpCommand(
            $socket,
            base64_encode(SMTP_USERNAME),
            [334]
        );


        /*
         * Google App Password
         */
        smtpCommand(
            $socket,
            base64_encode(SMTP_PASSWORD),
            [235]
        );


        /*
         * Sender
         */
        smtpCommand(
            $socket,
            'MAIL FROM:<' . SMTP_USERNAME . '>',
            [250]
        );


        /*
         * Recipient
         */
        smtpCommand(
            $socket,
            'RCPT TO:<' . $to . '>',
            [250, 251]
        );


        /*
         * DATA
         */
        fwrite(
            $socket,
            "DATA\r\n"
        );

        smtpExpect(
            $socket,
            [354]
        );


        /*
         * Subject
         */
        $encodedSubject =
            '=?UTF-8?B?' .
            base64_encode($subject) .
            '?=';


        /*
         * Headers
         */
        $headers =
            'From: ' .
            COMPANY_NAME .
            ' <' .
            SMTP_USERNAME .
            ">\r\n" .

            'Reply-To: ' .
            $replyTo .
            "\r\n" .

            'To: ' .
            $to .
            "\r\n" .

            'Subject: ' .
            $encodedSubject .
            "\r\n" .

            "MIME-Version: 1.0\r\n" .

            "Content-Type: text/plain; charset=UTF-8\r\n" .

            "Content-Transfer-Encoding: 8bit\r\n";


        /*
         * Protect SMTP dot commands
         */
        $safeBody = preg_replace(
            '/^\./m',
            '..',
            $body
        );


        /*
         * Build email
         */
        $emailMessage =
            $headers .
            "\r\n" .
            $safeBody .
            "\r\n.";


        fwrite(
            $socket,
            $emailMessage . "\r\n"
        );


        /*
         * Confirm delivery to Gmail
         */
        smtpExpect(
            $socket,
            [250]
        );


        /*
         * Quit
         */
        smtpCommand(
            $socket,
            'QUIT',
            [221]
        );

    } finally {

        fclose($socket);
    }
}


/*
|--------------------------------------------------------------------------
| ONLY POST REQUESTS
|--------------------------------------------------------------------------
*/

if (
    $_SERVER['REQUEST_METHOD'] !== 'POST'
) {

    reply(
        false,
        'Invalid request.',
        405
    );
}


/*
|--------------------------------------------------------------------------
| HONEYPOT
|--------------------------------------------------------------------------
*/

if (
    !empty($_POST['website'] ?? '')
) {

    reply(
        true,
        'Thank you. Your message has been received.'
    );
}


/*
|--------------------------------------------------------------------------
| FORM DATA
|--------------------------------------------------------------------------
*/

$name = trim(
    (string)($_POST['name'] ?? '')
);

$email = trim(
    (string)($_POST['email'] ?? '')
);

$message = trim(
    (string)($_POST['message'] ?? '')
);


/*
|--------------------------------------------------------------------------
| REQUIRED FIELDS
|--------------------------------------------------------------------------
*/

if (
    $name === '' ||
    $email === '' ||
    $message === ''
) {

    reply(
        false,
        'Please complete all required fields.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| EMAIL VALIDATION
|--------------------------------------------------------------------------
*/

if (
    !filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    )
) {

    reply(
        false,
        'Please enter a valid email address.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| LENGTH LIMITS
|--------------------------------------------------------------------------
*/

if (
    mb_strlen($name) > 100 ||
    mb_strlen($email) > 180 ||
    mb_strlen($message) > 5000
) {

    reply(
        false,
        'One or more fields are too long.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| HEADER INJECTION PROTECTION
|--------------------------------------------------------------------------
*/

if (
    preg_match('/[\r\n]/', $name) ||
    preg_match('/[\r\n]/', $email)
) {

    reply(
        false,
        'Invalid form data.',
        422
    );
}


/*
|--------------------------------------------------------------------------
| SUBJECT
|--------------------------------------------------------------------------
*/

$subject =
    'Website Inquiry - ' .
    COMPANY_NAME;


/*
|--------------------------------------------------------------------------
| EMAIL MESSAGE
|--------------------------------------------------------------------------
*/

$body =
    "New website inquiry\r\n" .
    "\r\n" .

    "Name: " .
    $name .
    "\r\n" .

    "Email: " .
    $email .
    "\r\n" .

    "\r\n" .

    "Message:\r\n" .
    $message .
    "\r\n" .

    "\r\n" .

    "Sent from the Chels Wellness International Company website.";


/*
|--------------------------------------------------------------------------
| SEND
|--------------------------------------------------------------------------
*/

try {

    smtpSendGmail(
        COMPANY_EMAIL,
        $email,
        $subject,
        $body
    );


    reply(
        true,
        'Thank you! Your message has been sent successfully.'
    );


} catch (Throwable $e) {

    /*
     * Technical error goes into the PHP/XAMPP error log.
     */
    error_log(
        'CWI Gmail SMTP Error: ' .
        $e->getMessage()
    );


    reply(
        false,
        'The message could not be sent. Please check the Gmail SMTP configuration.',
        500
    );
}

?>