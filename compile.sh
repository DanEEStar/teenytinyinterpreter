CC="gcc"

function comp {
    BN=$(basename -s .teeny $1)
    TTOUTPUT=$(bun run src/teeny/compilerScript.ts $1 2>&1)
    if [ $? -ne 0 ]; then
        echo "${TTOUTPUT}"
    else
        mv out/out.c out/${BN}.c
        clang-format -i out/${BN}.c
        CCOUTPUT=$(${CC} -o out/${BN} out/${BN}.c)
        if [ $? -ne 0 ]; then
            echo "${CCOUTPUT}"
        else
            echo "${TTOUTPUT}"
        fi
    fi
}

mkdir -p "out"

if [ $# -eq 0 ]; then
    for i in $(ls teeny/*.teeny); do
        comp $i
    done
else
    comp $1
fi