import { Link, useParams } from "react-router-dom"
import { TextContent, Text, TextVariants } from "@patternfly/react-core"

function Agent() {
    const { agentId } = useParams()

    return(
        <>
            <Link to="/">Back</Link>
            <TextContent>
                <Text component={TextVariants.h1}>Agent: {agentId}</Text>
            </TextContent>
        </>
    )
}

export default Agent
